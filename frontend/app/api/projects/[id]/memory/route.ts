import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";
import type { MemoryItem, MemoryCategory } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const memory = Array.from(mockStore.memory.values())
    .filter((m) => m.project_id === projectId)
    .sort((a, b) => {
      // Pinned first, then by date
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return NextResponse.json({ memory });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();

  const now = new Date().toISOString();
  const memory: MemoryItem = {
    id: mockStore.generateId("mem"),
    project_id: projectId,
    category: (body.category as MemoryCategory) || "note",
    content: body.content,
    source: body.source || null,
    pinned: body.pinned || false,
    in_working_set: body.in_working_set || false,
    created_at: now,
    updated_at: now,
  };

  mockStore.memory.set(memory.id, memory);

  return NextResponse.json({ memory });
}
