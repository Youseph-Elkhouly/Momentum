import { NextResponse } from "next/server";
import { runAutomation } from "@/lib/openclaw";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const automationId = (body.automation_id ?? body.id) as string | undefined;
  if (!automationId) {
    return NextResponse.json({ error: "automation_id required" }, { status: 400 });
  }

  const result = await runAutomation(automationId);
  return NextResponse.json(result);
}
