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

# Load RAG pipeline
try:
    from .rag_python import build_rag_chain
    print("LOG: Successfully imported build_rag_chain")
except Exception as e:
    print(f"CRITICAL ERROR during import: {str(e)}")
    print(traceback.format_exc())


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For debugging, allow all. Tighten this later.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Session chat histories
chat_histories = {}

@app.get("/chatbot")
async def create_session():
    print("LOG: GET /chatbot called")
    session_id = str(uuid4())
    chat_histories[session_id] = ChatMessageHistory()
    print(f"LOG: Created session {session_id}")
    return {"session_id": session_id}


@app.post("/ask")
async def ask_question(data: dict):
    print(f"LOG: POST /ask received data: {json.dumps(data)}")

    session_id = data.get("session_id")
    question = data.get("question")

    if not question:
        print("ERROR: No question provided in payload")
        raise HTTPException(status_code=400, detail="Question required")

    # Session persistence logic
    if not session_id or session_id not in chat_histories:
        print(f"LOG: Session {session_id} not found. Creating temporary history.")
        session_id = session_id or str(uuid4())
        chat_histories[session_id] = ChatMessageHistory()

    history = chat_histories[session_id]

    print(f"LOG: Invoking conversational chain for session {session_id}")
    
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