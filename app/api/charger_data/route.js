// /app/api/charger-data/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      "https://le3tvo1cgc.execute-api.us-east-1.amazonaws.com/prod/get-data?table=device2",
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from AWS' }, { status: response.status });
    }

    const data = await response.json();
    
    // Most AWS Lambda responses wrap the data in a body string
    const finalData = typeof data.body === 'string' ? JSON.parse(data.body) : data;

    return NextResponse.json(finalData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}