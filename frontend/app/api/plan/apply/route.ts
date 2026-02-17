import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { saveMemory } from "@/lib/backboard";
import { ApplyBodySchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const projectId = (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ?? db.listProjects()[0]?.id;
  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }
  const project = db.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = ApplyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { tasks, decisions = [], preferences = [], summary } = parsed.data;

  db.deleteTasksByProjectId(projectId);
  const taskIdGen = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  for (const t of tasks) {
    db.createTask(
      taskIdGen(),
      projectId,
      t.column_id ?? "todo",
      t.title,
      { description: t.description, priority: t.priority }
    );
  }
  for (const d of decisions) {
    saveMemory(projectId, "decision", d);
  }
  for (const p of preferences) {
    saveMemory(projectId, "preference", p);
  }
  if (summary) {
    saveMemory(projectId, "summary", summary);
  }

  const taskRows = db.getTasks(projectId);
  const byCol = { todo: [] as unknown[], doing: [] as unknown[], done: [] as unknown[] };
  for (const t of taskRows) {
    const col = t.column_id as keyof typeof byCol;
    byCol[col].push({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      priority: t.priority ?? undefined,
      owner: t.owner ?? undefined,
      due: t.due ?? undefined,
      blocked: t.blocked === 1,
      blocker_reason: t.blocker_reason ?? undefined,
    });
  }

  return NextResponse.json({
    ok: true,
    message: `Applied ${tasks.length} tasks and memory.`,
    tasks: byCol,
  });
}
