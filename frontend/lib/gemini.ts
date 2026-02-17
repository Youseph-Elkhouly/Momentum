import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MemoryRow } from "./db";
import type { TaskRow } from "./db";
import { buildPlanPrompt, buildUpdatePrompt, buildAskPrompt } from "./prompts";
import { PlanResponseSchema, UpdateResponseSchema, AskResponseSchema } from "./schemas";
import type { PlanResponse, UpdateResponse, AskResponse } from "./schemas";

const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY;

function getModel() {
  if (!GEMINI_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

/** Generate plan from notes. Returns strict JSON validated with Zod. */
export async function plan(
  goal: string,
  deadline: string | null,
  memoryChunks: MemoryRow[],
  currentTasks: TaskRow[],
  notes: string
): Promise<PlanResponse> {
  const model = getModel();
  if (!model) {
    return mockPlanResponse(notes);
  }
  const prompt = buildPlanPrompt(goal, deadline, memoryChunks, currentTasks, notes);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseJson<unknown>(text);
  return PlanResponseSchema.parse(raw);
}

/** Update tasks from progress notes. */
export async function update(
  goal: string,
  deadline: string | null,
  memoryChunks: MemoryRow[],
  currentTasks: TaskRow[],
  notes: string
): Promise<UpdateResponse> {
  const model = getModel();
  if (!model) {
    return mockUpdateResponse(currentTasks);
  }
  const prompt = buildUpdatePrompt(goal, deadline, memoryChunks, currentTasks, notes);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseJson<unknown>(text);
  return UpdateResponseSchema.parse(raw);
}

/** Answer question using retrieved memory. */
export async function ask(
  goal: string,
  memoryChunks: MemoryRow[],
  question: string
): Promise<AskResponse> {
  const model = getModel();
  if (!model) {
    return mockAskResponse(question, memoryChunks);
  }
  const prompt = buildAskPrompt(goal, memoryChunks, question);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseJson<unknown>(text);
  return AskResponseSchema.parse(raw);
}

function mockPlanResponse(notes: string): PlanResponse {
  return {
    summary: "Plan generated from your notes (mock — set GOOGLE_GEMINI_API_KEY for real).",
    decisions: ["Use MVP scope from notes.", "Prioritize core flow first."],
    preferences: ["Keep monochrome UI.", "Docs-first tone."],
    tasks: [
      { title: "Clarify scope", description: notes.slice(0, 80) + (notes.length > 80 ? "…" : ""), priority: "P0", column_id: "todo" },
      { title: "Break down milestones", priority: "P1", column_id: "todo" },
      { title: "Kick off", priority: "P2", column_id: "doing" },
    ],
    blockers: [],
    open_questions: ["Timeline confirmed?"],
    next_meeting_agenda: ["Review plan"],
  };
}

function mockUpdateResponse(tasks: TaskRow[]): UpdateResponse {
  const task_updates = tasks.slice(0, 2).map((t) => ({
    task_id: t.id,
    column_id: (t.column_id === "todo" ? "doing" : t.column_id) as "todo" | "doing" | "done",
  }));
  return {
    task_updates,
    new_tasks: [],
    blockers: [],
    summary: "Progress applied (mock).",
  };
}

function mockAskResponse(question: string, chunks: MemoryRow[]): AskResponse {
  const sources_used = chunks.slice(0, 3).map((c) => ({ id: c.id, type: c.type, content: c.content.slice(0, 120) + "…" }));
  return {
    answer: "Based on project memory (mock — set GOOGLE_GEMINI_API_KEY for real): focus on MVP scope and the decisions already recorded.",
    sources_used,
  };
}
