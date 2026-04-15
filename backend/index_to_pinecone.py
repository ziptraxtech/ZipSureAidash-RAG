"""
index_to_pinecone.py
--------------------
One-time (or on-demand) script to embed and upsert all static device data
into the Pinecone index so the RAG chain can do real semantic retrieval.

Run from the repo root with the venv active:
    python backend/index_to_pinecone.py

It is safe to re-run — stable vector IDs mean existing entries are overwritten,
not duplicated.
"""

import os
import json
import time
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")
INDEX_NAME       = "zipcharger-analytics1"
EMBEDDING_MODEL  = "models/gemini-embedding-001"  # 3072-dim
EMBED_DIM        = 3072
UPSERT_BATCH     = 50   # stay well under Pinecone's 2 MB / request limit

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ── helpers ──────────────────────────────────────────────────────────────────

def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GEMINI_API_KEY,
    )


def ensure_index(pc: Pinecone) -> None:
    names = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in names:
        print(f"Creating index '{INDEX_NAME}' …")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        # wait until ready
        while not pc.describe_index(INDEX_NAME).status["ready"]:
            time.sleep(1)
        print("Index ready.")
    else:
        print(f"Index '{INDEX_NAME}' already exists.")


def upsert_documents(pc: Pinecone, embeddings: GoogleGenerativeAIEmbeddings,
                     docs: list[Document], prefix: str) -> None:
    """Embed docs and upsert to Pinecone with stable IDs (prefix_0, prefix_1 …)."""
    if not docs:
        print(f"  [{prefix}] No documents — skipping.")
        return

    idx = pc.Index(INDEX_NAME)
    texts    = [d.page_content for d in docs]
    metas    = [d.metadata      for d in docs]

    print(f"  [{prefix}] Embedding {len(texts)} documents …")
    vectors = embeddings.embed_documents(texts)

    # Build Pinecone upsert records — store page_content under 'text' key
    # so PineconeVectorStore can reconstruct Documents on retrieval.
    records = [
        {
            "id":     f"{prefix}_{i}",
            "values": vectors[i],
            "metadata": {**metas[i], "text": texts[i]},
        }
        for i in range(len(docs))
    ]

    for start in range(0, len(records), UPSERT_BATCH):
        batch = records[start : start + UPSERT_BATCH]
        idx.upsert(vectors=batch)
        print(f"  [{prefix}] Upserted {start + len(batch)}/{len(records)}")

    print(f"  [{prefix}] Done — {len(records)} vectors in Pinecone.")


# ── loaders ──────────────────────────────────────────────────────────────────

def load_sapna_charger_docs() -> list[Document]:
    """
    Parse data/data.json (OCPP format) for device_id='sapna_charger'.
    Creates one Document per 10-reading window + a session-start Document.
    """
    path = os.path.join(BASE_DIR, "data", "data.json")
    with open(path) as f:
        data = json.load(f)

    device_id = "sapna_charger"
    docs: list[Document] = []

    # Session start
    tx = data.get("start_transaction", {})
    docs.append(Document(
        page_content=(
            "=== Sapna Charger — Session Start ===\n"
            f"Connector ID : {tx.get('connectorid', 'N/A')}\n"
            f"ID Tag       : {tx.get('idtag', 'N/A')}\n"
            f"Meter Start  : {tx.get('meterstart', 'N/A')} Wh\n"
            f"Start Time   : {tx.get('timestamp', 'N/A')}\n"
        ),
        metadata={"device_id": device_id, "source": "data_json", "type": "session_start"},
    ))

    # Meter value readings
    readings: list[str] = []
    for entry in data.get("metervalues", []):
        try:
            mv   = entry["payload"]["meterValue"][0]
            ts   = mv.get("timestamp", "N/A")
            svs  = mv.get("sampledValue", [])

            def _val(measurand: str) -> str:
                for sv in svs:
                    if sv.get("measurand") == measurand:
                        return sv.get("value", "N/A")
                return "N/A"

            readings.append(
                f"{ts}  |  {_val('Current.Import')} A  |  "
                f"{_val('Voltage')} V  |  SOC {_val('SoC')}%  |  "
                f"{_val('Energy.Active.Import.Register')} Wh  |  "
                f"{_val('Power.Active.Import')} W"
            )
        except (KeyError, IndexError, TypeError):
            continue

    # Chunk every 10 readings into one Document for granular retrieval
    chunk_size = 10
    for i in range(0, len(readings), chunk_size):
        chunk = readings[i : i + chunk_size]
        docs.append(Document(
            page_content=(
                f"=== Sapna Charger — Meter Readings (batch {i // chunk_size + 1}) ===\n"
                "Timestamp  |  Current  |  Voltage  |  SOC  |  Energy  |  Power\n"
                + "\n".join(chunk)
            ),
            metadata={
                "device_id": device_id,
                "source": "data_json",
                "type": "meter_readings",
                "chunk": i // chunk_size,
            },
        ))

    print(f"  Sapna charger: {len(docs)} documents ({len(readings)} readings).")
    return docs


def load_2ndmarch_docs() -> list[Document]:
    """
    Parse data/data_2ndmarch.json (OCPP nested key-value format).
    Each record becomes one Document tagged with its evse_id.
    """
    path = os.path.join(BASE_DIR, "data", "data_2ndmarch.json")
    with open(path) as f:
        raw = json.load(f)

    records = raw.get("data", raw) if isinstance(raw, dict) else raw
    docs: list[Document] = []

    for rec in records:
        evse_id    = rec.get("evse_id", "unknown")
        device_id  = f"evse_{evse_id}"
        event_type = rec.get("eventtype", "")
        created_at = rec.get("createdat", "")

        # Extract sampled values from nested OCPP structure
        readings_text: list[str] = []
        timestamp_str = ""

        for kv in rec.get("payload", []):
            if kv.get("Key") == "meterValue":
                for mv_entry in kv.get("Value", []):
                    for mv_kv in mv_entry:
                        if mv_kv.get("Key") == "timestamp":
                            timestamp_str = mv_kv.get("Value", "")
                        if mv_kv.get("Key") == "sampledValue":
                            for sv_list in mv_kv.get("Value", []):
                                measurand = value = unit = ""
                                for field in sv_list:
                                    k, v = field.get("Key", ""), field.get("Value", "")
                                    if k == "measurand": measurand = v
                                    elif k == "value":   value     = v
                                    elif k == "unit":    unit      = v
                                if measurand and value:
                                    readings_text.append(f"{measurand}: {value} {unit}")

        docs.append(Document(
            page_content=(
                f"=== Device {evse_id} — {event_type} ===\n"
                f"Operator   : {rec.get('operator_name', 'N/A')}\n"
                f"Event Type : {event_type}\n"
                f"Created At : {created_at}\n"
                f"Timestamp  : {timestamp_str}\n"
                + "\n".join(readings_text)
            ),
            metadata={
                "device_id": device_id,
                "evse_id":   evse_id,
                "source":    "data_2ndmarch",
                "type":      "meter_event",
            },
        ))

    print(f"  data_2ndmarch.json: {len(docs)} documents.")
    return docs


# ── entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== ZipSure AI — Pinecone Indexing ===\n")

    pc         = Pinecone(api_key=PINECONE_API_KEY)
    embeddings = get_embeddings()

    ensure_index(pc)
    print()

    print("Loading data files …")
    sapna_docs   = load_sapna_charger_docs()
    march_docs   = load_2ndmarch_docs()
    print(f"Total: {len(sapna_docs) + len(march_docs)} documents\n")

    print("Upserting to Pinecone …")
    upsert_documents(pc, embeddings, sapna_docs,  prefix="sapna_charger")
    upsert_documents(pc, embeddings, march_docs,  prefix="data_2ndmarch")

    print("\nIndexing complete.")

    # Final stats
    idx   = pc.Index(INDEX_NAME)
    stats = idx.describe_index_stats()
    print(f"Index '{INDEX_NAME}': {stats.total_vector_count} total vectors.")
