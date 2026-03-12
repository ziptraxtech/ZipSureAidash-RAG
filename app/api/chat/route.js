import { NextResponse } from 'next/server';

// AUTOMATIC URL DETECTION
// 1. If we are on Vercel, it uses the shared internal path (/api/py)
// 2. If we are local, it uses the Uvicorn port (127.0.0.1:8000)
const BACKEND_URL = process.env.VERCEL 
  ? `https://${process.env.VERCEL_URL}/api/py` 
  : 'http://127.0.0.1:8000';

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    
    // Check for session (using the smart URL)
    const sessionRes = await fetch(`${BACKEND_URL}/chatbot`);
    if (!sessionRes.ok) throw new Error("Backend session failed");
    
    const { session_id } = await sessionRes.json();

    // Call /ask
    const askRes = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session_id,
        question: lastMessage.content
      }),
    });

    const pythonData = await askRes.json();
    return new Response(pythonData.response);

  } catch (error) {
    console.error("Route Error:", error);
    return new Response("Error: Could not connect to the AI assistant.", { status: 500 });
  }
}