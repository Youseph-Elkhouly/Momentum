import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory, saveMemory } from "@/lib/backboard";
import { plan } from "@/lib/gemini";
import { PlanResponseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const projectId = (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ?? db.listProjects()[0]?.id;
  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }

  const project = db.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const notes = (body.notes ?? "").trim();
  if (!notes) {
    return NextResponse.json({ error: "notes required" }, { status: 400 });
  }

  const memoryChunks = retrieveMemory(projectId);
  const currentTasks = db.getTasks(projectId);

  const raw = await plan(
    project.goal ?? project.name,
    project.deadline,
    memoryChunks,
    currentTasks,
    notes
  );
  const parsed = PlanResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan response", details: parsed.error.flatten() }, { status: 500 });
  }
  const planData = parsed.data;

  const now = new Date().toISOString();
  const taskIdGen = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  db.deleteTasksByProjectId(projectId);
  for (const t of planData.tasks) {
    db.createTask(
      taskIdGen(),
      projectId,
      t.column_id ?? "todo",
      t.title,
      { description: t.description, priority: t.priority, owner: t.owner, due: t.due }
    );
  }

  for (const d of planData.decisions) {
    saveMemory(projectId, "decision", d);
  }
  for (const p of planData.preferences) {
    saveMemory(projectId, "preference", p);
  }
  saveMemory(projectId, "summary", planData.summary);

  const decisionsCount = planData.decisions.length;
  const tasksCount = planData.tasks.length;
  const recalledCount = memoryChunks.length;

  return NextResponse.json({
    ok: true,
    message: `Momentum recalled ${recalledCount} items · created ${tasksCount} tasks · updated ${decisionsCount} decisions`,
    tasks: db.getTasks(projectId).reduce((acc, t) => {
      const col = t.column_id as "todo" | "doing" | "done";
      if (!acc[col]) acc[col] = [];
      acc[col].push({
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        priority: t.priority ?? undefined,
        owner: t.owner ?? undefined,
        due: t.due ?? undefined,
        blocked: t.blocked === 1,
        blocker_reason: t.blocker_reason ?? undefined,
      });
      return acc;
    }, {} as Record<string, unknown[]>),
  });
}
