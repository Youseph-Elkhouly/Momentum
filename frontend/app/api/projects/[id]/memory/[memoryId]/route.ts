import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  const { memoryId } = await params;
  const body = await request.json();

  const memory = mockStore.memory.get(memoryId);
  if (!memory) {
    return NextResponse.json({ error: "Memory item not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updated = {
    ...memory,
    ...body,
    updated_at: now,
  };

  mockStore.memory.set(memoryId, updated);

  return NextResponse.json({ memory: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  const { memoryId } = await params;

  if (!mockStore.memory.has(memoryId)) {
    return NextResponse.json({ error: "Memory item not found" }, { status: 404 });
  }

  mockStore.memory.delete(memoryId);

  return NextResponse.json({ success: true });
}
