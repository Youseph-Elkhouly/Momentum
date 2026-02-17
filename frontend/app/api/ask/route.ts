import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";
import { retrieveMemory } from "@/lib/backboard";
import { ask } from "@/lib/gemini";
import { AskResponseSchema } from "@/lib/schemas";
import * as backboardClient from "@/lib/backboard-client";

export async function POST(request: Request) {
  const projectId = (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value ?? db.listProjects()[0]?.id;
  if (!projectId) {
    return NextResponse.json({ error: "No project selected" }, { status: 400 });
  }

  const project = db.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  // Get local memory for context
  const memoryChunks = retrieveMemory(projectId);

  // Try Backboard first if configured
  if (backboardClient.isBackboardConfigured()) {
    try {
      const projectContext = {
        goal: project.goal ?? undefined,
        decisions: memoryChunks.filter((m) => m.type === "decision").map((m) => m.content),
        preferences: memoryChunks.filter((m) => m.type === "preference").map((m) => m.content),
        risks: memoryChunks.filter((m) => m.type === "risk").map((m) => m.content),
      };

      const backboardResponse = await backboardClient.askMomentum(question, projectContext);

      return NextResponse.json({
        answer: backboardResponse.answer,
        sources_used: backboardResponse.sources.map((s) => ({ type: "memory", content: s })),
      });
    } catch (error) {
      console.error("Backboard API error, falling back to Gemini:", error);
      // Fall through to Gemini
    }
  }

  // Fallback to Gemini
  const raw = await ask(project.goal ?? project.name, memoryChunks, question);
  const parsed = AskResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ask response", details: parsed.error.flatten() }, { status: 500 });
  }

  return NextResponse.json({
    answer: parsed.data.answer,
    sources_used: parsed.data.sources_used,
  });
}
