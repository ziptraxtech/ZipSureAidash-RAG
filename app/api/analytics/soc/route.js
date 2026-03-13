import { NextResponse } from "next/server";

// This is a mock API route.
// TODO: Replace this with a real database query to fetch SOC data.
function getMockSocData() {
  const data = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    data.push({
      timestamp: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
      soc: (95 - i * 1.5).toFixed(2), // Simulate SOC decreasing over time
    });
  }
  return data;
}

export async function GET() {
  try {
    const socData = getMockSocData();
    return NextResponse.json(socData);
  } catch (error) {
    console.error("Failed to fetch SOC data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
