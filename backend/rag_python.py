import os
import json
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_core.runnables import RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")


def _make_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=GEMINI_API_KEY,
        temperature=0.7,
    )

def _make_prompt(device_name: str, current_datetime: str = None):
    now_line = f"Current date/time : {current_datetime}\n" if current_datetime else ""
    system_prompt = (
        f"You are an expert EV charging analyst for {device_name}.\n"
        f"{now_line}"
        "Answer questions using ONLY the provided charger telemetry data.\n"
        "Data fields: datetime, current (Amps), voltage_inlet (Volts), soc (%), "
        "energy (Wh cumulative), temperature (°C).\n"
        "Energy formula: current × voltage × Δt_seconds / 3600 = Wh.\n"
        "A session ends when current drops below 1 A OR there is a gap > 30 minutes.\n"
        "Always include units (Wh, kWh, A, V, %, °C) in your answers.\n"
        "For relative time questions ('last active', 'how long ago'), compute the "
        "difference between the current date/time above and the relevant timestamp.\n"
        "If the requested data is not in the context, say so — do not fabricate values.\n\n"
        "{context}"
    )
    return ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])


# ── Chain for devices 1–8: pre-computed summary injected from Next.js ────────

def _format_summary_docs(device_id: str, summary: dict) -> list:
    """
    Turn the structured summary (data_range, global_stats, sessions, recent)
    into a small set of readable Documents the LLM can reason over accurately.
    """
    docs = []
    device_name = f"Charger {device_id}"

    # 1. Data range + global stats
    g = summary.get("global_stats", {})
    dr = summary.get("data_range", {})
    overview = (
        f"=== {device_name} — Overview ===\n"
        f"Data range   : {dr.get('start')} → {dr.get('end')}\n"
        f"Total points : {dr.get('total_points')}\n"
        f"Voltage      : {g.get('voltage_v')} V\n"
        f"Max current  : {g.get('max_current_a')} A\n"
        f"Max temp     : {g.get('max_temperature_c')} °C\n"
        f"Cumul. energy: {g.get('total_cumulative_energy_wh')} Wh "
        f"({g.get('total_cumulative_energy_kwh')} kWh)\n"
        f"Current SOC  : {g.get('current_soc_pct')} %\n"
    )
    docs.append(Document(page_content=overview,
                         metadata={"source": "summary_overview", "device_id": device_id}))

    # 2. One document per session
    for s in summary.get("sessions", []):
        session_text = (
            f"=== {device_name} — Session {s['session']} ===\n"
            f"Start        : {s['start']}\n"
            f"End          : {s['end']}\n"
            f"Duration     : {s['duration_min']} min\n"
            f"Energy       : {s['energy_wh']} Wh ({s['energy_kwh']} kWh)\n"
            f"Peak current : {s['peak_current_a']} A\n"
            f"Avg current  : {s['avg_current_a']} A\n"
            f"Peak temp    : {s['peak_temp_c']} °C\n"
            f"SOC start    : {s.get('start_soc_pct')} %\n"
            f"SOC end      : {s.get('end_soc_pct')} %\n"
            f"Voltage      : {s.get('voltage_v')} V\n"
            f"Data points  : {s['data_points']}\n"
        )
        docs.append(Document(page_content=session_text,
                             metadata={"source": "session", "device_id": device_id,
                                       "session": s["session"]}))

    # 3. Most recent readings
    recent = summary.get("most_recent_readings", [])
    if recent:
        lines = [f"=== {device_name} — Most Recent Readings ==="]
        for r in recent:
            lines.append(
                f"{r['time']}  |  {r['current_a']} A  |  {r['voltage_v']} V  |  "
                f"SOC {r['soc_pct']}%  |  {r['energy_wh']} Wh  |  {r['temp_c']} °C"
            )
        docs.append(Document(page_content="\n".join(lines),
                             metadata={"source": "recent_readings", "device_id": device_id}))

    return docs


def build_summary_chain(device_id: str, device_summary: dict, current_datetime: str = None):
    """
    Chain for devices 1–8: uses a pre-computed structured summary as context.
    No Pinecone — the LLM reads clean, pre-calculated facts.
    """
    docs = _format_summary_docs(device_id, device_summary)
    print(f"DEBUG: Summary chain for device_id={device_id!r} — {len(docs)} documents")

    retriever = RunnableLambda(lambda _: docs)

    device_name = f"Charger {device_id}"
    llm = _make_llm()
    prompt = _make_prompt(device_name, current_datetime)

    qa_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, qa_chain)


# ── Chain for device 9: load JSON directly (no Pinecone needed) ──────────────

def _extract_sampled_value(sampled_values: list, measurand: str) -> str:
    """Pull the value for a given measurand from an OCPP sampledValue list."""
    for sv in sampled_values:
        if sv.get("measurand") == measurand:
            return sv.get("value", "N/A")
    return "N/A"


def _load_json_docs():
    """
    Load data/data.json (OCPP format) and return human-readable Document objects.
    Structure: { "start_transaction": {...}, "metervalues": [...] }
    """
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(base_path, "data", "data.json")
    print(f"DEBUG: Loading JSON from {path}")

    if not os.path.exists(path):
        print(f"ERROR: File not found at {path}")
        return []

    try:
        with open(path, 'r') as f:
            data = json.load(f)

        docs = []

        # 1. Session start context
        tx = data.get("start_transaction", {})
        session_doc = (
            "=== Sapna Charger — Session Start ===\n"
            f"Connector ID  : {tx.get('connectorid', 'N/A')}\n"
            f"ID Tag        : {tx.get('idtag', 'N/A')}\n"
            f"Meter Start   : {tx.get('meterstart', 'N/A')} Wh\n"
            f"Start Time    : {tx.get('timestamp', 'N/A')}\n"
        )
        docs.append(Document(page_content=session_doc, metadata={"source": "data_json", "type": "session_start"}))

        # 2. One document per meter reading (flattened from OCPP format)
        readings = []
        for entry in data.get("metervalues", []):
            try:
                mv = entry["payload"]["meterValue"][0]
                timestamp = mv.get("timestamp", "N/A")
                svs = mv.get("sampledValue", [])

                energy_wh  = _extract_sampled_value(svs, "Energy.Active.Import.Register")
                voltage_in = _extract_sampled_value(svs, "Voltage")  # first Voltage = inlet
                current_a  = _extract_sampled_value(svs, "Current.Import")
                power_w    = _extract_sampled_value(svs, "Power.Active.Import")
                soc_pct    = _extract_sampled_value(svs, "SoC")

                readings.append(
                    f"{timestamp}  |  {current_a} A  |  {voltage_in} V  |  "
                    f"SOC {soc_pct}%  |  {energy_wh} Wh  |  {power_w} W"
                )
            except (KeyError, IndexError):
                continue

        if readings:
            # Group into chunks of 12 readings per document for better context
            for i in range(0, len(readings), 12):
                chunk = readings[i:i + 12]
                content = "=== Sapna Charger — Meter Readings ===\n"
                content += "Timestamp  |  Current  |  Voltage  |  SOC  |  Energy  |  Power\n"
                content += "\n".join(chunk)
                docs.append(Document(
                    page_content=content,
                    metadata={"source": "data_json", "type": "meter_readings", "chunk": i // 12}
                ))

        print(f"DEBUG: Loaded {len(docs)} documents from data.json ({len(readings)} readings)")
        return docs
    except Exception as e:
        print(f"Error loading data.json: {e}")
        return []


def build_json_chain(device_id=None, current_datetime=None):
    """
    Chain for device 9 (sapna_charger): uses the static JSON file as context.
    Pinecone is skipped — the filter by evse_id would never match 'sapna_charger'.
    All JSON records are injected directly so the LLM sees the full dataset.
    """
    print(f"DEBUG: Building JSON chain for device_id={device_id!r}")
    docs = _load_json_docs()

    if not docs:
        print("WARNING: No JSON documents found — chain will have empty context")

    retriever = RunnableLambda(lambda _: docs)

    device_name = "Sapna Charger (Charger 9)"
    llm = _make_llm()
    prompt = _make_prompt(device_name, current_datetime)

    qa_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, qa_chain)


# ── Public entry point (called by main.py) ────────────────────────────────────

def build_rag_chain(device_id=None, device_summary=None, current_datetime=None):
    """
    Route to the right chain:
    - device_summary provided (devices 1–8): live summary chain
    - no device_summary (device 9 / fallback): static JSON chain
    """
    if device_summary:
        return build_summary_chain(device_id, device_summary, current_datetime)
    return build_json_chain(device_id, current_datetime)
