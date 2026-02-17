import { NextResponse } from "next/server";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://localhost:5100";

export async function GET() {
  const status = {
    openclaw: false,
    backboard: !!process.env.BACKBOARD_API_KEY,
    gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
    mode: process.env.NEXT_PUBLIC_APP_MODE || "demo",
  };

  // Check if OpenClaw is running
  try {
    const response = await fetch(`${OPENCLAW_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    status.openclaw = response.ok;
  } catch {
    status.openclaw = false;
  }

  return NextResponse.json(status);
}
