import os
import json
import sys
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback 

# --- NEW IMPORTS ADDED HERE ---
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# --- 1. INITIALIZE APP IMMEDIATELY ---
app = FastAPI()

# --- 2. ADD MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"] 
)

load_dotenv()

# --- 3. SAFE IMPORT FOR RAG ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from rag_python import build_rag_chain
    print("LOG: Successfully imported build_rag_chain")
except Exception as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
    traceback.print_exc()
    def build_rag_chain(*args, **kwargs):
        return None
    
# Global history store
chat_histories = {}

# --- 4. ROUTES ---

@app.get("/chatbot")
@app.get("/chatbot/")
@app.get("/python_api/chatbot")
async def create_session():
    try:
        print("LOG: GET /chatbot called")
        session_id = str(uuid4())
        # Initialize the history object
        chat_histories[session_id] = ChatMessageHistory()
        return {"session_id": session_id}
    except Exception as e:
        print(f"ERROR in /chatbot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
@app.post("/python_api/ask")
async def ask_question(data: dict):
    print(f"LOG: POST /ask received data: {json.dumps(data)}")
    
    question = data.get("question")
    session_id = data.get("session_id")
    device_id = data.get("deviceId") 

    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    # 1. DYNAMIC INITIALIZATION 
    try:
        current_rag_chain = build_rag_chain(device_id=device_id) 
        if current_rag_chain is None:
            raise Exception("RAG Chain is not initialized properly.")
    except Exception as e:
        print(f"ERROR during RAG setup: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI context.")

    # 2. SESSION HISTORY
    if not session_id or session_id not in chat_histories:
        session_id = session_id or str(uuid4())
        chat_histories[session_id] = ChatMessageHistory()
    
    history = chat_histories[session_id]

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
        print(f"ERROR during invoke: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))