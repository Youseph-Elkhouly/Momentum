import { NextResponse } from "next/server";
import { updateMemoryContent, pinMemory } from "@/lib/backboard";
import * as db from "@/lib/db";
import * as backboardClient from "@/lib/backboard-client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (typeof body.content === "string") {
    updateMemoryContent(id, body.content);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.pinned === "boolean") {
    pinMemory(id, body.pinned);

    // Sync to Backboard when pinning (async, non-blocking)
    if (body.pinned && backboardClient.isBackboardConfigured()) {
      syncToBackboard(id).catch((err) =>
        console.error("Failed to sync pinned memory to Backboard:", err)
      );
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "content or pinned required" }, { status: 400 });
}

async function syncToBackboard(memoryId: string) {
  // Get the memory item from local DB
  const memory = db.getMemoryChunkById(memoryId);

  if (!memory) return;

  const assistantId = await backboardClient.getOrCreateMomentumAssistant();

  await backboardClient.saveMemory(assistantId, memory.content, {
    type: memory.type,
    projectId: memory.project_id,
    localId: memory.id,
    createdAt: memory.created_at,
  });
}
