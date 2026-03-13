import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req) {
  const host = req.headers.get('host');
  
  // Point specifically to the /python_api rewrite prefix
  const PYTHON_BRIDGE = process.env.VERCEL 
    ? `https://${host}/python_api` 
    : 'http://127.0.0.1:8000';

  console.log("--- NEXT.JS ROUTE START ---");
  
  try {
    const { messages } = await req.json();
    const userQuestion = messages[messages.length - 1].content;
    console.log(`Step 1: User Question: "${userQuestion}"`);

    // 1. Check Session (Calling Python via the bridge)
    console.log(`Step 2: Fetching session from: ${PYTHON_BRIDGE}/chatbot`);
    const sessionRes = await fetch(`${PYTHON_BRIDGE}/chatbot`, { cache: 'no-store' });
    
    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error(`Step 2 FAIL: Status ${sessionRes.status}. Body: ${errorText}`);
      throw new Error(`Python Session Init Failed: ${sessionRes.status}`);
    }
    
    const { session_id } = await sessionRes.json();
    console.log(`Step 2 SUCCESS: Got Session ID: ${session_id}`);

    // 2. Ask RAG (Calling Python via the bridge)
    console.log(`Step 3: Sending to ${PYTHON_BRIDGE}/ask...`);
    const askRes = await fetch(`${PYTHON_BRIDGE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question: userQuestion }),
    });

    if (!askRes.ok) {
      const askError = await askRes.text();
      console.error(`Step 3 FAIL: Status ${askRes.status}. Body: ${askError}`);
      throw new Error(`Python RAG Failed: ${askRes.status}`);
    }

    const pythonData = await askRes.json();
    console.log(`Step 4 SUCCESS: Received Python Response`);

    return NextResponse.json({ role: 'assistant', content: pythonData.response });

  } catch (error) {
    console.error("!!! NEXT.JS ROUTE ERROR !!!:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}