import os
import json
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback # Crucial for logs!

from .rag_python import build_rag_chain
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

try:
    rag_chain = build_rag_chain()
    print("LOG: Successfully initialized rag_chain")
except Exception as e:
    print(f"CRITICAL ERROR during RAG initialization: {str(e)}")
    print(traceback.format_exc())
    rag_chain = None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"] 
)

chat_histories = {}

@app.get("/chatbot")
@app.get("/python_api/chatbot")
async def create_session():
    print("LOG: GET /chatbot called")
    session_id = str(uuid4())
    chat_histories[session_id] = ChatMessageHistory()
    return {"session_id": session_id}


@app.post("/ask")
@app.post("/python_api/ask")
async def ask_question(data: dict):
    print(f"LOG: POST /ask received data: {json.dumps(data)}")
    
    # Safety check if initialization failed
    if rag_chain is None:
        raise HTTPException(status_code=500, detail="RAG system failed to initialize on server.")

    session_id = data.get("session_id")
    question = data.get("question")

    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    if not session_id or session_id not in chat_histories:
        session_id = session_id or str(uuid4())
        chat_histories[session_id] = ChatMessageHistory()

    history = chat_histories[session_id]

    # This wrapper connects your RAG chain to the session history
    conversational_chain = RunnableWithMessageHistory(
        rag_chain,
        lambda session_id: history,
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
        
        # Manually updating history if the runnable doesn't do it automatically
        history.add_user_message(question)
        history.add_ai_message(answer)

        return JSONResponse({
            "session_id": session_id,
            "question": question,
            "response": answer,
        })
    except Exception as e:
        print(f"ERROR during chain invocation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))