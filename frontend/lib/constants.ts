/** Centralized defaults — no magic strings scattered. */

export const APP_NAME = "Momentum";

export const TASK_COLUMNS = ["todo", "doing", "done"] as const;
export type TaskColumnId = (typeof TASK_COLUMNS)[number];

export const MEMORY_TYPES = ["decision", "preference", "risk", "requirement", "summary"] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

export const PRIORITIES = ["P0", "P1", "P2"] as const;

export const DEFAULT_AUTOMATIONS = [
  { id: "standup_daily", name: "Standup daily", description: "Daily standup reminder" },
  { id: "blocker_ping", name: "Blocker ping", description: "Ping when task is blocked" },
  { id: "create_github_issue", name: "Create GitHub issue", description: "Create issue from task" },
] as const;

export const COOKIE_CURRENT_PROJECT = "momentum_current_project_id";
