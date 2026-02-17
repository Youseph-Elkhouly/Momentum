import type { MemoryRow } from "./db";
import type { TaskRow } from "./db";

const SYSTEM = `You are Momentum, an AI project assistant. You output ONLY valid JSON. No markdown, no explanation.`;

function formatMemory(chunks: MemoryRow[]): string {
  if (chunks.length === 0) return "No prior memory.";
  return chunks.map((c) => `[${c.type}] ${c.content}`).join("\n");
}

function formatTasks(tasks: TaskRow[]): string {
  if (tasks.length === 0) return "No tasks yet.";
  return tasks
    .map((t) => `- ${t.title} (${t.column_id}${t.blocked ? ", BLOCKED: " + (t.blocker_reason || "?") : ""})`)
    .join("\n");
}

export function buildPlanPrompt(
  goal: string,
  deadline: string | null,
  memoryChunks: MemoryRow[],
  currentTasks: TaskRow[],
  notes: string
): string {
  return `${SYSTEM}

Project goal: ${goal}
Deadline: ${deadline ?? "Not set"}

## Current memory (Backboard)
${formatMemory(memoryChunks)}

## Current tasks
${formatTasks(currentTasks)}

## New notes / transcript from user
${notes}

Generate a plan. Output a single JSON object matching this shape (no other text):
{
  "summary": "1-2 sentence project summary",
  "decisions": ["decision 1", "decision 2"],
  "preferences": ["preference 1"],
  "tasks": [{"title": "...", "description": "...", "priority": "P0"|"P1"|"P2", "owner": "...", "due": "...", "column_id": "todo"|"doing"|"done"}],
  "blockers": [{"task_id": "...", "reason": "..."}],
  "open_questions": ["..."],
  "next_meeting_agenda": ["..."]
}
Replace existing tasks with the full new task list you recommend. Use column_id for each task. Output only the JSON object.`;
}

export function buildUpdatePrompt(
  goal: string,
  deadline: string | null,
  memoryChunks: MemoryRow[],
  currentTasks: TaskRow[],
  notes: string
): string {
  return `${SYSTEM}

Project goal: ${goal}
Deadline: ${deadline ?? "Not set"}

## Current memory
${formatMemory(memoryChunks)}

## Current tasks (with ids)
${currentTasks.map((t) => `id=${t.id} | ${t.title} | ${t.column_id} | blocked=${t.blocked}`).join("\n")}

## Progress notes from user
${notes}

Update task statuses based on progress. Output a single JSON object:
{
  "task_updates": [{"task_id": "...", "column_id": "todo"|"doing"|"done", "blocked": true|false, "blocker_reason": "..."}],
  "new_tasks": [{"title": "...", "column_id": "...", ...}],
  "blockers": [{"task_id": "...", "reason": "..."}],
  "summary": "Optional 1 sentence update summary"
}
Only include task_updates for tasks that changed. Output only the JSON object.`;
}

export function buildAskPrompt(
  goal: string,
  memoryChunks: MemoryRow[],
  question: string
): string {
  return `${SYSTEM}

Project goal: ${goal}

## Retrieved memory (Backboard)
${formatMemory(memoryChunks)}

## User question
${question}

Answer concisely using only the memory above. Output a single JSON object:
{
  "answer": "Your concise answer",
  "sources_used": [{"id": "...", "type": "...", "content": "excerpt from memory used"}]
}
Output only the JSON object.`;
}
