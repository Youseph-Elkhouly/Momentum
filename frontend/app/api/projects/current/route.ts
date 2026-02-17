import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory } from "@/lib/backboard";

export async function GET() {
  const cookieStore = await cookies();
  let projectId = cookieStore.get(COOKIE_CURRENT_PROJECT)?.value ?? null;
  if (!projectId || !db.getProject(projectId)) {
    const first = db.listProjects()[0];
    projectId = first?.id ?? null;
  }
  if (!projectId) {
    return NextResponse.json({
      project: null,
      tasks: { todo: [], doing: [], done: [] },
      memory: { decisions: [], preferences: [], risks: [], summary: [] },
      automations: [],
    });
  }

  const project = db.getProject(projectId)!;
  const taskRows = db.getTasks(projectId);
  const tasksByColumn = { todo: [] as typeof taskRows, doing: [] as typeof taskRows, done: [] as typeof taskRows };
  for (const t of taskRows) {
    if (t.column_id in tasksByColumn) tasksByColumn[t.column_id as keyof typeof tasksByColumn].push(t);
  }

  const memoryByType = retrieveMemory(projectId);
  const memory = {
    decisions: memoryByType.filter((m) => m.type === "decision").map((m) => ({ id: m.id, content: m.content, created_at: m.created_at, pinned: m.pinned === 1 })),
    preferences: memoryByType.filter((m) => m.type === "preference").map((m) => ({ id: m.id, content: m.content, created_at: m.created_at, pinned: m.pinned === 1 })),
    risks: memoryByType.filter((m) => m.type === "risk").map((m) => ({ id: m.id, content: m.content, created_at: m.created_at, pinned: m.pinned === 1 })),
    summary: memoryByType.filter((m) => m.type === "summary").map((m) => ({ id: m.id, content: m.content, created_at: m.created_at, pinned: m.pinned === 1 })),
  };

  const { listAutomations } = await import("@/lib/openclaw");
  const automations = listAutomations();

  return NextResponse.json({
    project: { id: project.id, name: project.name, goal: project.goal, deadline: project.deadline, repo_url: project.repo_url ?? null },
    tasks: {
      todo: tasksByColumn.todo.map(rowToTask),
      doing: tasksByColumn.doing.map(rowToTask),
      done: tasksByColumn.done.map(rowToTask),
    },
    memory,
    automations,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectId = (body.project_id ?? body.projectId) as string | undefined;
  if (!projectId) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }
  const project = db.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_CURRENT_PROJECT, projectId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

function rowToTask(r: { id: string; title: string; description: string | null; priority: string | null; owner: string | null; due: string | null; blocked: number; blocker_reason: string | null }) {
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
