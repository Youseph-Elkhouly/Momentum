import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory } from "@/lib/backboard";
import { plan } from "@/lib/gemini";
import { PlanResponseSchema } from "@/lib/schemas";

/** Returns a plan (tasks, decisions, preferences, summary) without writing to DB. */
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

  return NextResponse.json({
    summary: parsed.data.summary,
    decisions: parsed.data.decisions,
    preferences: parsed.data.preferences,
    tasks: parsed.data.tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority ?? "P2",
      column_id: t.column_id ?? "todo",
    })),
  });
}
