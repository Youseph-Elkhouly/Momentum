import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { TASK_COLUMNS } from "./constants";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "momentum.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  runMigrations(db);
  return db;
}

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      goal TEXT,
      deadline TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      column_id TEXT NOT NULL CHECK(column_id IN ('todo', 'doing', 'done')),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('P0', 'P1', 'P2')),
      owner TEXT,
      due TEXT,
      blocked INTEGER DEFAULT 0,
      blocker_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS memory_chunks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('decision', 'preference', 'risk', 'requirement', 'summary')),
      content TEXT NOT NULL,
      pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_memory_project ON memory_chunks(project_id);
    CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_chunks(project_id, type);
  `);

  try {
    database.exec("ALTER TABLE projects ADD COLUMN repo_url TEXT");
  } catch {
    // column may already exist
  }

  const count = database.prepare("SELECT COUNT(*) as n FROM projects").get() as { n: number };
  if (count.n === 0) seed(database);
}

function seed(database: Database.Database) {
  const now = new Date().toISOString();
  database.prepare(
    `INSERT INTO projects (id, name, goal, deadline, repo_url, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)`
  ).run("proj-demo", "Momentum MVP", "Ship a minimal AI-powered project dashboard with Gemini, Backboard, and OpenClaw", "2026-03-30", now, now);

  const taskRows = [
    ["t1", "proj-demo", "todo", "Review project scope", "Align with stakeholders", "P0", "You", "2026-03-15", 0, null],
    ["t2", "proj-demo", "todo", "Set up dev environment", null, "P2", null, "2026-03-18", 0, null],
    ["t3", "proj-demo", "doing", "Build dashboard UI", "Next.js + Tailwind", "P1", "You", "2026-03-20", 0, null],
    ["t4", "proj-demo", "done", "Clone repository", null, null, null, null, 0, null],
    ["t5", "proj-demo", "done", "Define requirements", null, null, "You", null, 0, null],
  ];
  const insertTask = database.prepare(
    `INSERT INTO tasks (id, project_id, column_id, title, description, priority, owner, due, blocked, blocker_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of taskRows) {
    insertTask.run(...row, now, now);
  }

  const memoryRows = [
    ["m1", "proj-demo", "decision", "Use Next.js App Router and Tailwind only; no component libraries.", 0, now, now],
    ["m2", "proj-demo", "preference", "Monochrome UI; documentation-first tone.", 0, now, now],
    ["m3", "proj-demo", "risk", "Scope creep on first release — keep MVP tight.", 0, now, now],
    ["m4", "proj-demo", "summary", "Momentum MVP: minimal dashboard with Gemini plans, Backboard memory, OpenClaw automations.", 0, now, now],
  ];
  const insertMem = database.prepare(
    `INSERT INTO memory_chunks (id, project_id, type, content, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of memoryRows) {
    insertMem.run(...row);
  }

  for (const a of [
    { id: "standup_daily", name: "Standup daily", desc: "Daily standup reminder", enabled: 1 },
    { id: "blocker_ping", name: "Blocker ping", desc: "Ping when task is blocked", enabled: 1 },
    { id: "create_github_issue", name: "Create GitHub issue", desc: "Create issue from task", enabled: 0 },
  ]) {
    database.prepare(
      `INSERT OR IGNORE INTO automations (id, name, description, enabled, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).run(a.id, a.name, a.desc, a.enabled, now);
  }
}

export interface ProjectRow {
  id: string;
  name: string;
  goal: string | null;
  deadline: string | null;
  repo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  owner: string | null;
  due: string | null;
  blocked: number;
  blocker_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: string;
  project_id: string;
  type: string;
  content: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export function listProjects(): ProjectRow[] {
  return getDb().prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
}

export function getProject(id: string): ProjectRow | undefined {
  return getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
}

export function createProject(id: string, name: string, goal?: string, deadline?: string): ProjectRow {
  const now = new Date().toISOString();
  getDb().prepare(
    "INSERT INTO projects (id, name, goal, deadline, repo_url, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)"
  ).run(id, name, goal ?? null, deadline ?? null, now, now);
  return getProject(id)!;
}

export function updateProjectRepo(projectId: string, repoUrl: string | null): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE projects SET repo_url = ?, updated_at = ? WHERE id = ?").run(repoUrl, now, projectId);
}

export function getTasks(projectId: string): TaskRow[] {
  return getDb().prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC").all(projectId) as TaskRow[];
}

export function deleteTasksByProjectId(projectId: string): void {
  getDb().prepare("DELETE FROM tasks WHERE project_id = ?").run(projectId);
}

export function createTask(
  id: string,
  projectId: string,
  columnId: string,
  title: string,
  opts?: { description?: string; priority?: string; owner?: string; due?: string }
): TaskRow {
  const now = new Date().toISOString();
  getDb().prepare(
    `INSERT INTO tasks (id, project_id, column_id, title, description, priority, owner, due, blocked, blocker_reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`
  ).run(id, projectId, columnId, title, opts?.description ?? null, opts?.priority ?? null, opts?.owner ?? null, opts?.due ?? null, now, now);
  return getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
}

export function updateTaskColumn(taskId: string, columnId: string): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE tasks SET column_id = ?, updated_at = ? WHERE id = ?").run(columnId, now, taskId);
}

export function setTaskBlocked(taskId: string, blocked: boolean, reason?: string): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE tasks SET blocked = ?, blocker_reason = ?, updated_at = ? WHERE id = ?").run(blocked ? 1 : 0, reason ?? null, now, taskId);
}

export function getMemoryChunks(projectId: string, type?: string): MemoryRow[] {
  if (type) {
    return getDb().prepare("SELECT * FROM memory_chunks WHERE project_id = ? AND type = ? ORDER BY pinned DESC, created_at DESC").all(projectId, type) as MemoryRow[];
  }
  return getDb().prepare("SELECT * FROM memory_chunks WHERE project_id = ? ORDER BY type, pinned DESC, created_at DESC").all(projectId) as MemoryRow[];
}

export function insertMemoryChunk(
  id: string,
  projectId: string,
  type: string,
  content: string,
  pinned?: boolean
): MemoryRow {
  const now = new Date().toISOString();
  getDb().prepare(
    "INSERT INTO memory_chunks (id, project_id, type, content, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, projectId, type, content, pinned ? 1 : 0, now, now);
  return getDb().prepare("SELECT * FROM memory_chunks WHERE id = ?").get(id) as MemoryRow;
}

export function updateMemoryChunk(id: string, content: string): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE memory_chunks SET content = ?, updated_at = ? WHERE id = ?").run(content, now, id);
}

export function setMemoryPinned(id: string, pinned: boolean): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE memory_chunks SET pinned = ?, updated_at = ? WHERE id = ?").run(pinned ? 1 : 0, now, id);
}

export function getAutomations(): { id: string; name: string; description: string | null; enabled: number }[] {
  return getDb().prepare("SELECT id, name, description, enabled FROM automations").all() as { id: string; name: string; description: string | null; enabled: number }[];
}

export function setAutomationEnabled(id: string, enabled: boolean): void {
  const now = new Date().toISOString();
  getDb().prepare("UPDATE automations SET enabled = ?, updated_at = ? WHERE id = ?").run(enabled ? 1 : 0, now, id);
}

export function getAllMemoryChunks(): MemoryRow[] {
  return getDb().prepare("SELECT * FROM memory_chunks ORDER BY type, pinned DESC, created_at DESC").all() as MemoryRow[];
}

export function getMemoryChunkById(id: string): MemoryRow | undefined {
  return getDb().prepare("SELECT * FROM memory_chunks WHERE id = ?").get(id) as MemoryRow | undefined;
}
