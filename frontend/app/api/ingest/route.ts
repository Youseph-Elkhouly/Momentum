import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { saveMemory } from "@/lib/backboard";

export async function POST(request: Request) {
  const projectId = (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ?? db.listProjects()[0]?.id;
  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const notes = (body.notes ?? body.transcript ?? "").trim();
  if (!notes) {
    return NextResponse.json({ error: "notes or transcript required" }, { status: 400 });
  }

  const chunk = saveMemory(projectId, "requirement", notes);
  return NextResponse.json({ id: chunk.id, ok: true });
}
