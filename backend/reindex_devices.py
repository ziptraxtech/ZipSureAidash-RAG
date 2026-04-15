"""
reindex_devices.py
------------------
Fetches live telemetry from AWS for devices 1–8, processes the raw points
into clean text chunks, and upserts them into Pinecone so the RAG chain
can do real semantic retrieval over historical data.

Can be run standalone:
    python backend/reindex_devices.py

Or called programmatically from main.py as a scheduled background task.
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime, timezone
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from pinecone import Pinecone as PineconeClient

load_dotenv()

PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY")
INDEX_NAME        = "zipcharger-analytics1"
EMBEDDING_MODEL   = "models/gemini-embedding-001"
UPSERT_BATCH      = 50
AWS_BASE_URL      = "https://le3tvo1cgc.execute-api.us-east-1.amazonaws.com/prod/get-data"
FETCH_TIMEOUT     = 20  # seconds

# Device table mapping: key = rawId sent by Next.js (matches deviceId in chat route)
# value = DynamoDB table name used in AWS Lambda
DEVICE_TABLES = {
    "1": "acCurrent_Data",   # device 1 uses a different table
    "2": "device2",
    "3": "device3",
    "4": "device4",
    "5": "device5",
    "6": "device6",
    "7": "device7",
    "8": "device8",
}

GAP_LIMIT_MS       = 30 * 60 * 1000   # 30 minutes
CURRENT_THRESHOLD  = 1.0               # A — below this = not charging
READINGS_PER_CHUNK = 15                # raw readings per Document
VOLTAGE_DEFAULT    = 230               # V — used when not in data


# ── AWS fetch ─────────────────────────────────────────────────────────────────

async def fetch_device_data(session: aiohttp.ClientSession,
                            device_id: str, table: str) -> list[dict]:
    """Fetch raw telemetry from AWS Lambda and return a sorted list of points."""
    url = f"{AWS_BASE_URL}?table={table}"
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=FETCH_TIMEOUT)) as resp:
            if resp.status != 200:
                print(f"  [{device_id}] AWS returned {resp.status} — skipping.")
                return []
            raw = await resp.json(content_type=None)
            # Handle three possible shapes from AWS:
            # 1. Already a list of points
            # 2. {"body": "[...]"} — Lambda proxy with JSON string body
            # 3. {"body": [...]}  — Lambda proxy with parsed body
            if isinstance(raw, list):
                points = raw
            elif isinstance(raw, dict):
                body = raw.get("body", raw)
                points = json.loads(body) if isinstance(body, str) else body
            else:
                points = []

            if not isinstance(points, list):
                print(f"  [{device_id}] Unexpected data format — skipping.")
                return []

            # Normalise device1 format (date+time+ac_current) to shared format
            normalised = []
            for p in points:
                if "date" in p and "time" in p:
                    # Device 1 schema
                    normalised.append({
                        "datetime":      f"{p['date']}T{p['time']}",
                        "current":       max(0.0, float(p.get("ac_current", 0) or 0)),
                        "voltage_inlet": 360,
                        "temperature":   float(p.get("temperature", 0) or 0),
                        "soc":           None,
                        "energy":        None,
                    })
                else:
                    # Devices 2-8 schema
                    normalised.append({
                        "datetime":      p.get("datetime", ""),
                        "current":       float(p.get("current", 0) or 0),
                        "voltage_inlet": float(p.get("voltage_inlet", VOLTAGE_DEFAULT) or VOLTAGE_DEFAULT),
                        "temperature":   float(p.get("temperature", 0) or 0),
                        "soc":           p.get("soc"),
                        "energy":        p.get("energy"),
                    })

            # Sort by datetime, drop epoch-zero entries
            valid = [p for p in normalised
                     if p["datetime"] and not p["datetime"].startswith("1970")]
            valid.sort(key=lambda p: p["datetime"])
            print(f"  [{device_id}] Fetched {len(valid)} valid points.")
            return valid

    except asyncio.TimeoutError:
        print(f"  [{device_id}] AWS request timed out — skipping.")
        return []
    except Exception as e:
        print(f"  [{device_id}] Fetch error: {e} — skipping.")
        return []


# ── Data processing ───────────────────────────────────────────────────────────

def _energy_wh(points: list[dict]) -> float:
    """Calculate energy in Wh via I × V × Δt integration."""
    wh = 0.0
    for i in range(1, len(points)):
        dt_s = (datetime.fromisoformat(points[i]["datetime"].replace("Z", "+00:00")) -
                datetime.fromisoformat(points[i-1]["datetime"].replace("Z", "+00:00"))).total_seconds()
        if 0 < dt_s <= GAP_LIMIT_MS / 1000:
            wh += points[i]["current"] * points[i]["voltage_inlet"] * dt_s / 3600
    return max(0.0, wh)


def build_sessions(points: list[dict]) -> list[list[dict]]:
    """Split points into charging sessions based on time gaps and current drops."""
    sessions, buf = [], []
    for i, p in enumerate(points):
        if i == 0:
            buf.append(p)
            continue
        prev = points[i - 1]
        dt_ms = (datetime.fromisoformat(p["datetime"].replace("Z", "+00:00")) -
                 datetime.fromisoformat(prev["datetime"].replace("Z", "+00:00"))).total_seconds() * 1000
        gap_break     = dt_ms > GAP_LIMIT_MS
        current_drop  = (float(prev["current"]) >= CURRENT_THRESHOLD and
                         float(p["current"])    <  CURRENT_THRESHOLD)
        if gap_break or current_drop:
            if buf:
                sessions.append(buf)
            buf = [p]
        else:
            buf.append(p)
    if buf:
        sessions.append(buf)
    return sessions


def points_to_documents(device_id: str, points: list[dict]) -> list[Document]:
    """
    Convert processed telemetry points into LangChain Documents ready for embedding.
    Creates three tiers of Documents:
      1. Per-session summaries  — for "how much energy in session 2?" queries
      2. Chunked raw readings   — for "what was the current at 10am?" queries
      3. Global overview        — for "total energy today?" queries
    """
    if not points:
        return []

    device_name = f"Charger {device_id}"
    docs: list[Document] = []
    sessions = build_sessions(points)

    # ── 1. Session summary documents ─────────────────────────────────────────
    for idx, sess in enumerate(sessions, 1):
        if len(sess) < 2:
            continue
        wh       = _energy_wh(sess)
        currents = [p["current"] for p in sess]
        temps    = [p["temperature"] for p in sess if p["temperature"]]
        socs     = [p["soc"] for p in sess if p.get("soc") is not None]

        docs.append(Document(
            page_content=(
                f"=== {device_name} — Session {idx} ===\n"
                f"Start        : {sess[0]['datetime']}\n"
                f"End          : {sess[-1]['datetime']}\n"
                f"Data points  : {len(sess)}\n"
                f"Energy       : {wh:.2f} Wh  ({wh/1000:.3f} kWh)\n"
                f"Peak current : {max(currents):.2f} A\n"
                f"Avg current  : {sum(currents)/len(currents):.2f} A\n"
                f"Peak temp    : {max(temps):.1f} °C\n" if temps else ""
                f"SOC start    : {socs[0]} %\n"  if socs else ""
                f"SOC end      : {socs[-1]} %\n" if socs else ""
                f"Voltage      : {sess[0]['voltage_inlet']} V\n"
            ),
            metadata={
                "device_id":   device_id,
                "source":      "aws_live",
                "type":        "session",
                "session_num": idx,
            },
        ))

    # ── 2. Chunked raw readings ───────────────────────────────────────────────
    for chunk_i in range(0, len(points), READINGS_PER_CHUNK):
        chunk = points[chunk_i : chunk_i + READINGS_PER_CHUNK]
        lines = [f"=== {device_name} — Raw Readings (batch {chunk_i // READINGS_PER_CHUNK + 1}) ===",
                 "Timestamp  |  Current  |  Voltage  |  SOC  |  Energy  |  Temp"]
        for p in chunk:
            soc_str    = f"{p['soc']} %" if p.get("soc") is not None else "—"
            energy_str = f"{p['energy']:.2f} Wh" if p.get("energy") is not None else "—"
            lines.append(
                f"{p['datetime']}  |  {p['current']:.2f} A  |  "
                f"{p['voltage_inlet']:.0f} V  |  SOC {soc_str}  |  "
                f"{energy_str}  |  {p['temperature']:.1f} °C"
            )
        docs.append(Document(
            page_content="\n".join(lines),
            metadata={
                "device_id": device_id,
                "source":    "aws_live",
                "type":      "raw_readings",
                "chunk":     chunk_i // READINGS_PER_CHUNK,
            },
        ))

    # ── 3. Global overview document ───────────────────────────────────────────
    all_currents = [p["current"] for p in points]
    all_temps    = [p["temperature"] for p in points if p["temperature"]]
    total_wh     = sum(_energy_wh(s) for s in sessions)

    docs.append(Document(
        page_content=(
            f"=== {device_name} — Overview ===\n"
            f"Data range     : {points[0]['datetime']} → {points[-1]['datetime']}\n"
            f"Total points   : {len(points)}\n"
            f"Total sessions : {len(sessions)}\n"
            f"Total energy   : {total_wh:.2f} Wh  ({total_wh/1000:.3f} kWh)\n"
            f"Max current    : {max(all_currents):.2f} A\n"
            f"Max temp       : {max(all_temps):.1f} °C\n" if all_temps else ""
            f"Last seen      : {points[-1]['datetime']}\n"
            f"Last current   : {points[-1]['current']:.2f} A\n"
            f"Last voltage   : {points[-1]['voltage_inlet']:.0f} V\n"
        ),
        metadata={
            "device_id": device_id,
            "source":    "aws_live",
            "type":      "overview",
        },
    ))

    return docs


# ── Pinecone upsert ───────────────────────────────────────────────────────────

def upsert_device_documents(pc: PineconeClient,
                             embeddings: GoogleGenerativeAIEmbeddings,
                             device_id: str,
                             docs: list[Document]) -> None:
    """Embed and upsert documents to Pinecone with stable IDs."""
    if not docs:
        return

    idx    = pc.Index(INDEX_NAME)
    texts  = [d.page_content for d in docs]
    metas  = [d.metadata     for d in docs]

    print(f"  [{device_id}] Embedding {len(texts)} documents …")
    vectors = embeddings.embed_documents(texts)

    records = [
        {
            "id":       f"{device_id}_live_{i}",   # stable → overwrites on re-run
            "values":   vectors[i],
            "metadata": {**metas[i], "text": texts[i]},
        }
        for i in range(len(docs))
    ]

    for start in range(0, len(records), UPSERT_BATCH):
        batch = records[start : start + UPSERT_BATCH]
        idx.upsert(vectors=batch)

    print(f"  [{device_id}] Upserted {len(records)} vectors.")


# ── Main reindex routine ──────────────────────────────────────────────────────

async def reindex_all_devices() -> dict:
    """
    Fetch, process, and re-index all devices 1–8 into Pinecone.
    Returns a summary dict with per-device stats.
    """
    print(f"\n[reindex] Starting at {datetime.now(timezone.utc).isoformat()}")

    pc         = PineconeClient(api_key=PINECONE_API_KEY)
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GEMINI_API_KEY,
    )

    summary = {}

    async with aiohttp.ClientSession() as session:
        # Fetch all devices concurrently
        tasks = {
            device_id: fetch_device_data(session, device_id, table)
            for device_id, table in DEVICE_TABLES.items()
        }
        results = {
            device_id: await coro
            for device_id, coro in tasks.items()
        }

    # Process and upsert sequentially (embedding API has rate limits)
    for device_id, points in results.items():
        if not points:
            summary[device_id] = {"status": "skipped", "points": 0, "docs": 0}
            continue
        try:
            docs = points_to_documents(device_id, points)
            upsert_device_documents(pc, embeddings, device_id, docs)
            summary[device_id] = {
                "status": "ok",
                "points": len(points),
                "docs":   len(docs),
            }
        except Exception as e:
            print(f"  [{device_id}] Error during indexing: {e}")
            summary[device_id] = {"status": "error", "error": str(e)}

    # Final Pinecone stats
    idx   = pc.Index(INDEX_NAME)
    stats = idx.describe_index_stats()
    print(f"[reindex] Done. Pinecone total vectors: {stats.total_vector_count}")
    print(f"[reindex] Summary: {summary}\n")
    return summary


# ── Standalone entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    asyncio.run(reindex_all_devices())
