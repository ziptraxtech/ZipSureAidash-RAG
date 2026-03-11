import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuestion = lastMessage.content;

    // 1. Get/Create a session (Simplified for now)
    const sessionRes = await fetch(`${BACKEND_URL}/chatbot`);
    const sessionData = await sessionRes.json();
    const sessionId = sessionData.session_id;

    // 2. Call your Python /ask endpoint
    const askRes = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question: userQuestion
      }),
    });

    // 3. IMPORTANT: Extract the JSON from Python
    const pythonData = await askRes.json();

    // 4. Return ONLY the text string (pythonData.response) 
    // This allows useChat to see the text and put it in the bubble.
    return new Response(pythonData.response);


  } catch (error) {
    console.error("Route Error:", error);
    return new Response("Error: Could not connect to the AI assistant.", { status: 500 });
  }
}