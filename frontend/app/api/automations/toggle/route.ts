import { NextResponse } from "next/server";
import { toggleAutomation } from "@/lib/openclaw";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const automationId = (body.automation_id ?? body.id) as string | undefined;
  const enabled = body.enabled as boolean | undefined;
  if (!automationId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "automation_id and enabled (boolean) required" }, { status: 400 });
  }

  toggleAutomation(automationId, enabled);
  return NextResponse.json({ ok: true, id: automationId, enabled });
}
