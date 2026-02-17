import { NextResponse } from "next/server";
import { mockStore, createMockRun } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const runs = Array.from(mockStore.runs.values())
    .filter((r) => r.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ runs });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  const { command } = body;

  if (!command) {
    return NextResponse.json({ error: "Command is required" }, { status: 400 });
  }

  // Create a mock run with steps
  const { run, approvals } = createMockRun(projectId, command);

  // Store run and approvals
  mockStore.runs.set(run.id, run);
  for (const approval of approvals) {
    mockStore.approvals.set(approval.id, approval);
  }

  return NextResponse.json({ run, approvals });
}
