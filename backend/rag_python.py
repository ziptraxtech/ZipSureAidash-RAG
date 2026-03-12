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
    # 1. Get the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Build the path relative to this script
    # This assumes your JSON is in a folder named 'data' at the root
    # Adjust "../data/data_2ndmarch.json" based on where your file sits relative to this code
    path = os.path.join(os.getcwd(), "data", "charts1.json")

    # Fallback for local testing if the relative path fails
    if not os.path.exists(path):
        print(f"Warning: File not found at {path}, trying local fallback...")
        path = "data/data_2ndmarch.json" 

    try:
        with open(path, "r") as f:
            data = json.load(f)

        documents = []
        for key, value in data.items():
            content = f"{key}: {value}"
            documents.append(
                Document(
                    page_content=content,
                    metadata={"source": "analytics_json"}
                )
            )
        return documents
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return []

def build_rag_chain():
    docs = load_json_documents()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=100
    )
    splits = splitter.split_documents(docs)

    # Gemini Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",google_api_key=GEMINI_API_KEY,task_type="retrieval_document")

    # Initialize Pinecone for storage of embeddings
    pc = Pinecone(api_key=PINECONE_API_KEY)

    index_name = "zipcharger-analytics1"
    if index_name not in pc.list_indexes().names():

        pc.create_index(
            name=index_name,
            dimension=768,#Important: Must match embedding dimension while creating index at pinecone
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )

    vectorstore = PineconeVectorStore.from_documents(
        documents=splits,
        embedding=embeddings,
        index_name=index_name,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # Gemini LLM
    llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=GEMINI_API_KEY,
    temperature=0.7)


    system_prompt = (
        "You are an AI assistant for EV Charger Analytics.\n"
        "Answer questions based on charger analytics data.\n"
        "Provide concise business insights.\n\n"
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