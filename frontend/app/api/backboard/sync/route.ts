import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory } from "@/lib/backboard";
import * as backboardClient from "@/lib/backboard-client";

export async function POST() {
  if (!backboardClient.isBackboardConfigured()) {
    return NextResponse.json(
      { error: "Backboard API not configured" },
      { status: 400 }
    );
  }

  const projectId =
    (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ??
    db.listProjects()[0]?.id;

  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }

  const project = db.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    // Get or create the Momentum assistant
    const assistantId = await backboardClient.getOrCreateMomentumAssistant();

    // Get all pinned memory items
    const memoryChunks = retrieveMemory(projectId);
    const pinnedMemory = memoryChunks.filter((m) => m.pinned);

    // Sync each pinned memory item to Backboard
    const synced: string[] = [];
    for (const memory of pinnedMemory) {
      try {
        await backboardClient.saveMemory(assistantId, memory.content, {
          type: memory.type,
          projectId,
          localId: memory.id,
          createdAt: memory.created_at,
        });
        synced.push(memory.id);
      } catch (error) {
        console.error(`Failed to sync memory ${memory.id}:`, error);
      }
    }

    // Also save project context as memory
    if (project.goal) {
      await backboardClient.saveMemory(assistantId, `Project Goal: ${project.goal}`, {
        type: "context",
        projectId,
      });
    }

    return NextResponse.json({
      success: true,
      assistantId,
      syncedCount: synced.length,
      totalPinned: pinnedMemory.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
