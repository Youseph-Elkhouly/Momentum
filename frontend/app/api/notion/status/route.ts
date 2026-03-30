import { NextResponse } from "next/server";
import { checkNotionConnection, isNotionConfigured } from "@/lib/notion-api";

export async function GET() {
  try {
    const configured = isNotionConfigured();

    if (!configured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: "Notion is not configured. Set NOTION_TOKEN in environment."
      });
    }

    // Check if Notion API is reachable
    const connected = await checkNotionConnection();

    return NextResponse.json({
      configured: true,
      connected,
      default_database_id: process.env.NOTION_DEFAULT_DATABASE_ID || null,
      message: connected
        ? "Notion is connected and ready"
        : "Notion is configured but API is not reachable. Check your NOTION_TOKEN."
    });

  } catch (error) {
    console.error("Error checking Notion status:", error);
    return NextResponse.json({
      configured: isNotionConfigured(),
      connected: false,
      error: error instanceof Error ? error.message : "Failed to check Notion status"
    });
  }
}
