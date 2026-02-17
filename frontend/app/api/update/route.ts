import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory } from "@/lib/backboard";
import { update } from "@/lib/gemini";
import { UpdateResponseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const projectId = (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ?? db.listProjects()[0]?.id;
  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }

  const project = db.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const notes = (body.notes ?? "").trim();

  const memoryChunks = retrieveMemory(projectId);
  const currentTasks = db.getTasks(projectId);

  const raw = await update(
    project.goal ?? project.name,
    project.deadline,
    memoryChunks,
    currentTasks,
    notes
  );
  const parsed = UpdateResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update response", details: parsed.error.flatten() }, { status: 500 });
  }
  const data = parsed.data;

  for (const u of data.task_updates) {
    if (u.column_id) db.updateTaskColumn(u.task_id, u.column_id);
    if (u.blocked !== undefined) db.setTaskBlocked(u.task_id, u.blocked, u.blocker_reason);
  }

  const taskIdGen = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  for (const t of data.new_tasks ?? []) {
    db.createTask(
      taskIdGen(),
      projectId,
      t.column_id ?? "todo",
      t.title,
      { description: t.description, priority: t.priority, owner: t.owner, due: t.due }
    );
  }

  const taskRows = db.getTasks(projectId);
  const tasksByColumn = { todo: [] as typeof taskRows, doing: [] as typeof taskRows, done: [] as typeof taskRows };
  for (const t of taskRows) {
    if (t.column_id in tasksByColumn) tasksByColumn[t.column_id as keyof typeof tasksByColumn].push(t);
  }

  return NextResponse.json({
    ok: true,
    message: data.summary ?? "Progress updated.",
    tasks: {
      todo: tasksByColumn.todo.map(rowToTask),
      doing: tasksByColumn.doing.map(rowToTask),
      done: tasksByColumn.done.map(rowToTask),
    },
  });
}

function rowToTask(r: db.TaskRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    priority: r.priority ?? undefined,
    owner: r.owner ?? undefined,
    due: r.due ?? undefined,
    blocked: r.blocked === 1,
    blocker_reason: r.blocker_reason ?? undefined,
  };
}
