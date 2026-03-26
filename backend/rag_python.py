import os
import json
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

def load_json_documents():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(base_path, "data", "data_2ndmarch.json")
    print(f"DEBUG: Looking for JSON at {path}")

    if not os.path.exists(path):
        print(f"ERROR: File not found at {path}")
        return [] 

    documents = []
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            # Assuming your JSON has a field identifying the charger
            if isinstance(data, list):
                for item in data:
                    # Capture the device identity
                    device_id = str(item.get("device_id", "unknown")) 
                    content = json.dumps(item) 
                    documents.append(
                        Document(
                            page_content=content,
                            metadata={
                                "source": "analytics_json",
                                "device_id": device_id  # CRITICAL for filtering
                            }
                        )
                    )

            elif isinstance(data, dict):
                for key, value in data.items():
                    content = f"{key}: {value}"
                    documents.append(
                        Document(
                            page_content=content,
                            metadata={"source": "analytics_json"}
                        )
                    )
            print(f"DEBUG: Successfully loaded {len(documents)} documents")
            return documents
            
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return []

def build_rag_chain(device_id=None):
    print("DEBUG: Starting build_rag_chain...")
    
    # Check for keys early
    if not GEMINI_API_KEY:
        print("CRITICAL: GEMINI_API_KEY is missing!")
    if not PINECONE_API_KEY:
        print("CRITICAL: PINECONE_API_KEY is missing!")

    docs = load_json_documents()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=400
    )
    splits = splitter.split_documents(docs)

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",google_api_key=GEMINI_API_KEY,task_type="retrieval_document")

    pc = Pinecone(api_key=PINECONE_API_KEY)

    index_name = "zipcharger-analytics1"
    
    if index_name not in pc.list_indexes().names():
        print(f"ERROR: Index {index_name} does not exist. Please index your data locally first.")
        return None

    vectorstore = PineconeVectorStore(
        index_name="zipcharger-analytics1",
        embedding=embeddings,
        pinecone_api_key=PINECONE_API_KEY
    )

    # If a device_id is provided, we filter the search results
    search_kwargs = {"k": 4}
    if device_id:
        search_kwargs["filter"] = {"device_id": {"$eq": device_id}}

    retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
    llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=GEMINI_API_KEY,temperature=0.7)
    device_name = f"Charger {device_id}" if device_id else "all chargers"
    system_prompt = (
        f"You are an AI assistant for {device_name} Analytics.\n"
        "Answer questions based ONLY on the provided charger telemetry.\n"
        "If data is missing for a specific time, state that clearly.\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    qa_chain = create_stuff_documents_chain(llm, prompt)

    rag_chain = create_retrieval_chain(
        retriever,
        qa_chain
    )

    return rag_chain

# For checking which embedding models are available in your Gemini API, you can use the following code snippet:
# import google.generativeai as genai
# genai.configure(api_key=GEMINI_API_KEY)
# print([m.name for m in genai.list_models() if 'embedContent' in m.supported_generation_methods])