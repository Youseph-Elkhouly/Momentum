import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";
import type { Task } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const tasks = Array.from(mockStore.tasks.values()).filter(
    (t) => t.project_id === projectId
  );

  return NextResponse.json({ tasks });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();

  const now = new Date().toISOString();
  const task: Task = {
    id: mockStore.generateId("task"),
    project_id: projectId,
    title: body.title,
    description: body.description || null,
    priority: body.priority || null,
    owner: body.owner || null,
    owner_type: body.owner_type || "human",
    due: body.due || null,
    status: body.status || "todo",
    stage: body.stage || "proposed",
    blocked: false,
    blocker_reason: null,
    acceptance_criteria: body.acceptance_criteria || [],
    parent_task_id: body.parent_task_id || null,
    created_by: body.created_by || "human",
    created_at: now,
    updated_at: now,
  };

  mockStore.tasks.set(task.id, task);

  return NextResponse.json({ task });
}
