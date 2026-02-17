import * as db from "./db";
import type { MemoryRow } from "./db";
import { MEMORY_TYPES } from "./constants";

export type MemoryChunkType = (typeof MEMORY_TYPES)[number];

/** Save a memory chunk (decision, preference, risk, requirement, summary). */
export function saveMemory(
  projectId: string,
  type: MemoryChunkType,
  content: string,
  opts?: { pinned?: boolean }
): MemoryRow {
  const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return db.insertMemoryChunk(id, projectId, type, content, opts?.pinned);
}

/** Retrieve memory for context: by type or all. For MVP we do simple list (no semantic search). */
export function retrieveMemory(projectId: string, opts?: { type?: MemoryChunkType; limit?: number }): MemoryRow[] {
  const rows = opts?.type
    ? db.getMemoryChunks(projectId, opts.type)
    : db.getMemoryChunks(projectId);
  const limit = opts?.limit ?? 50;
  return rows.slice(0, limit);
}

/** List memory grouped by type for UI. */
export function listMemoryByType(projectId: string): Record<string, MemoryRow[]> {
  const rows = db.getMemoryChunks(projectId);
  const out: Record<string, MemoryRow[]> = {};
  for (const type of MEMORY_TYPES) {
    out[type] = rows.filter((r) => r.type === type);
  }
  return out;
}

export function updateMemoryContent(id: string, content: string): void {
  db.updateMemoryChunk(id, content);
}

export function pinMemory(id: string, pinned: boolean): void {
  db.setMemoryPinned(id, pinned);
}
