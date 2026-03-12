import os
import json
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .rag_python import build_rag_chain
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For debugging, allow all. Tighten this later.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load RAG pipeline
rag_chain = build_rag_chain()

# Session chat histories
chat_histories = {}

@app.get("/chatbot")
async def create_session():
    session_id = str(uuid4())
    chat_histories[session_id] = ChatMessageHistory()
    return {"session_id": session_id}


@app.post("/ask")
async def ask_question(data: dict):
    session_id = data.get("session_id")
    question = data.get("question")
    
    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    # FIX: If session doesn't exist (because Vercel cleared memory), create it on the fly
    if not session_id or session_id not in chat_histories:
        session_id = session_id or str(uuid4())
        chat_histories[session_id] = ChatMessageHistory()

    history = chat_histories[session_id]

    conversational_chain = RunnableWithMessageHistory(
        rag_chain,
        lambda session: history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    response = conversational_chain.invoke(
        {"input": question},
        {"configurable": {"session_id": session_id}},
    )
    print(f"DEBUG: RAG response: {response}") # Add this line!
    answer = response.get("answer", "No response available.")

    print(f"DEBUG: Answer extracted: {answer}") # Add this line!
    history.add_user_message(question)
    history.add_ai_message(answer)

    return JSONResponse(
        {
            "session_id": session_id,
            "question": question,
            "response": answer,
        }
    )