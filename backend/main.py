import os
import json
import sys
import time
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from rag_python import build_rag_chain
    print("LOG: Successfully imported build_rag_chain")
except Exception as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
    traceback.print_exc()
    def build_rag_chain(*args, **kwargs):
        return None

# --- Caches ---
# RAG chain cache: device_id -> chain (built once, reused)
_rag_chain_cache: dict = {}

# Session history cache: session_id -> {"history": ChatMessageHistory, "last_access": float}
_session_cache: dict = {}

SESSION_TTL_SECONDS = 3600  # 1 hour


def get_or_create_history(session_id: str) -> ChatMessageHistory:
    """Return existing session history or create a new one."""
    now = time.time()
    if session_id in _session_cache:
        _session_cache[session_id]["last_access"] = now
        return _session_cache[session_id]["history"]
    history = ChatMessageHistory()
    _session_cache[session_id] = {"history": history, "last_access": now}
    return history


def evict_expired_sessions():
    """Remove sessions that haven't been accessed within SESSION_TTL_SECONDS."""
    cutoff = time.time() - SESSION_TTL_SECONDS
    expired = [sid for sid, val in _session_cache.items() if val["last_access"] < cutoff]
    for sid in expired:
        del _session_cache[sid]
    if expired:
        print(f"LOG: Evicted {len(expired)} expired session(s)")


def get_or_build_rag_chain(device_id, device_summary=None, current_datetime=None):
    """
    Return a RAG chain for the given device_id.
    - Summary chains (devices 1–8): rebuilt every request (data + time changes).
    - Pinecone chain (device 9 / sapna_charger): cached indefinitely.
    """
    if device_summary:
        print(f"LOG: Building summary chain for device_id={device_id!r}")
        chain = build_rag_chain(device_id=device_id, device_summary=device_summary,
                                current_datetime=current_datetime)
        if chain is None:
            raise RuntimeError("Summary chain initialization returned None")
        return chain

    cache_key = device_id or "__all__"
    if cache_key not in _rag_chain_cache:
        print(f"LOG: Building Pinecone chain for device_id={device_id!r} (cache miss)")
        chain = build_rag_chain(device_id=device_id)
        if chain is None:
            raise RuntimeError("Pinecone chain initialization returned None")
        _rag_chain_cache[cache_key] = chain
    else:
        print(f"LOG: Using cached JSON chain for device_id={device_id!r}")
    return _rag_chain_cache[cache_key]


# --- Routes ---

@app.get("/chatbot")
@app.get("/chatbot/")
@app.get("/python_api/chatbot")
async def create_session():
    try:
        print("LOG: GET /chatbot called")
        session_id = str(uuid4())
        get_or_create_history(session_id)
        return {"session_id": session_id}
    except Exception as e:
        print(f"ERROR in /chatbot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
@app.post("/python_api/ask")
async def ask_question(data: dict):
    print(f"LOG: POST /ask received data: {json.dumps(data)}")

    # Evict stale sessions on every request (cheap dict scan)
    evict_expired_sessions()

    question = data.get("question")
    session_id = data.get("session_id") or str(uuid4())
    device_id = data.get("deviceId")
    device_summary    = data.get("device_summary")
    current_datetime  = data.get("current_datetime")

    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    # 1. Get (or build) the appropriate RAG chain
    try:
        current_rag_chain = get_or_build_rag_chain(device_id, device_summary, current_datetime)
    except Exception as e:
        print(f"ERROR during RAG setup: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI context.")

    # 2. Get or create session history
    history = get_or_create_history(session_id)

    conversational_chain = RunnableWithMessageHistory(
        current_rag_chain,
        lambda s_id: history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    try:
        response = conversational_chain.invoke(
            {"input": question},
            {"configurable": {"session_id": session_id}},
        )

        answer = response.get("answer", "No response available.")

        return JSONResponse({
            "session_id": session_id,
            "question": question,
            "response": answer,
            "device_context": device_id
        })
    except Exception as e:
        print(f"ERROR during invoke: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
