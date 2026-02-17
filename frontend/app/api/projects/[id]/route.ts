import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = mockStore.projects.get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get all related data
  const tasks = Array.from(mockStore.tasks.values()).filter((t) => t.project_id === id);
  const runs = Array.from(mockStore.runs.values())
    .filter((r) => r.project_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const approvals = Array.from(mockStore.approvals.values())
    .filter((a) => a.project_id === id && a.status === "pending");
  const memory = Array.from(mockStore.memory.values()).filter((m) => m.project_id === id);
  const automations = Array.from(mockStore.automations.values()).filter((a) => a.project_id === id);
  const integrations = Array.from(mockStore.integrations.values()).filter((i) => i.project_id === id);

  return NextResponse.json({
    project,
    tasks,
    runs,
    approvals,
    memory,
    automations,
    integrations,
  });
}
