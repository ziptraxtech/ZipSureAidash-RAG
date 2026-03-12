import { NextResponse } from 'next/server';

// AUTOMATIC URL SWITCH
// On Vercel, it uses the shared /api/py path. 
// Locally, it looks for your Uvicorn server on port 8000.
const BACKEND_URL = process.env.VERCEL 
  ? `https://${process.env.VERCEL_URL}/api/py` 
  : 'http://127.0.0.1:8000';

export const maxDuration = 60; // Allows up to 1 minute for the AI to think

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userQuestion = messages[messages.length - 1].content;

    // 1. Get Session from Python
    const sessionRes = await fetch(`${BACKEND_URL}/chatbot`);
    const { session_id } = await sessionRes.json();

    // 2. Ask RAG Question
    const askRes = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question: userQuestion }),
    });

    const pythonData = await askRes.json();
    return new Response(pythonData.response);

  } catch (error) {
    console.error("Connection Failed:", error.message);
    return new Response("Assistant unreachable. Check if backend is running.", { status: 500 });
  }
}