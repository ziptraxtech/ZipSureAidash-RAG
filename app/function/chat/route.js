import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.VERCEL 
  ? `https://${req.headers.get('host')}/python_api` 
  : 'http://127.0.0.1:8000';

export const maxDuration = 60; 

export async function POST(req) {
  console.log("--- NEXT.JS ROUTE START ---");
  try {
    const { messages } = await req.json();
    const userQuestion = messages[messages.length - 1].content;
    console.log(`Step 1: User Question: "${userQuestion}"`);

    // 1. Check Session
    console.log(`Step 2: Fetching session from: ${BACKEND_URL}/chatbot`);
    const sessionRes = await fetch(`${BACKEND_URL}/chatbot`);
    
    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error(`Step 2 FAIL: Status ${sessionRes.status}. Body: ${errorText}`);
      throw new Error("Python Session Init Failed");
    }
    
    const { session_id } = await sessionRes.json();
    console.log(`Step 2 SUCCESS: Got Session ID: ${session_id}`);

    // 2. Ask RAG
    console.log(`Step 3: Sending to /ask...`);
    const askRes = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question: userQuestion }),
    });

    if (!askRes.ok) {
      const askError = await askRes.text();
      console.error(`Step 3 FAIL: Status ${askRes.status}. Body: ${askError}`);
      throw new Error("Python RAG Failed");
    }

    const pythonData = await askRes.json();
    console.log(`Step 4 SUCCESS: Received Python Response`);

    return NextResponse.json({ role: 'assistant', content: pythonData.response });

  } catch (error) {
    console.error("!!! ROUTE CATASTROPHE !!!:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}