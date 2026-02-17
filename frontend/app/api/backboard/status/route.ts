import { NextResponse } from "next/server";
import * as backboardClient from "@/lib/backboard-client";

export async function GET() {
  const configured = backboardClient.isBackboardConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      message: "Backboard API key not configured. Set BACKBOARD_API_KEY in .env.local",
    });
  }

  try {
    // Try to list assistants to verify the API key works
    const assistants = await backboardClient.listAssistants();
    const momentumAssistant = assistants.find((a) => a.name === "Momentum Assistant");

    return NextResponse.json({
      configured: true,
      connected: true,
      assistants: assistants.length,
      momentumAssistant: momentumAssistant
        ? {
            id: momentumAssistant.assistant_id,
            name: momentumAssistant.name,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
