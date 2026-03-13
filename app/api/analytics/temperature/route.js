import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://qtt1y2v0oh.execute-api.ap-south-1.amazonaws.com/v1/temperature");
  const data = await res.json();
  return NextResponse.json(data);
}
