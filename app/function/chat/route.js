import { NextResponse } from 'next/server';

// AUTOMATIC URL SWITCH
// On Vercel, it uses the shared /api/py path. 
// Locally, it looks for your Uvicorn server on port 8000.
// This ensures we always hit the correct domain
const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
const BACKEND_URL = process.env.VERCEL ? `${host}/python_api` : 'http://127.0.0.1:8000';

export const maxDuration = 60; // Allows up to 1 minute for the AI to think

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userQuestion = messages[messages.length - 1].content;

    // 1. Get Session
    const sessionRes = await fetch(`${BACKEND_URL}/chatbot`);
    
    // GUARD: Check if session call failed
    if (!sessionRes.ok) {
        const errorText = await sessionRes.text();
        console.error("Session init failed:", errorText);
        throw new Error("Could not initialize chat session");
    }
    const { session_id } = await sessionRes.json();

    // 2. Ask RAG Question
    const askRes = await fetch(`${BACKEND_URL}/ask`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question: userQuestion }),
    });

    // GUARD: Check if /ask call failed
    if (!askRes.ok) {
        const errorBody = await askRes.text();
        console.error("Python Error:", errorBody);
        throw new Error("Python backend crashed. Check Vercel logs.");
    }

    const pythonData = await askRes.json();
    return new Response(pythonData.response);

  } catch (error) {
    console.error("Connection Failed:", error.message);
    // Returning a string instead of JSON here is fine for the chatbot UI
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}