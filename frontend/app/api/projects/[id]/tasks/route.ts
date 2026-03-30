import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";
import type { Task } from "@/lib/types";
import { createNotionPage, isNotionConfigured } from "@/lib/notion-api";

type TaskWithNotion = Task & { notion_page_id?: string };

// Helper to sync a single task to Notion
async function syncTaskToNotion(task: Task, databaseId: string): Promise<{ success: boolean; notion_page_id?: string; notion_url?: string; error?: string }> {
  try {
    const notionPage = await createNotionPage({
      database_id: databaseId,
      title: task.title
    });
    return {
      success: true,
      notion_page_id: notionPage.id,
      notion_url: notionPage.url
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync"
    };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const tasks = Array.from(mockStore.tasks.values()).filter(
    (t) => t.project_id === projectId
  );

  return NextResponse.json({ tasks });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();

  const now = new Date().toISOString();
  const task: Task = {
    id: mockStore.generateId("task"),
    project_id: projectId,
    title: body.title,
    description: body.description || null,
    priority: body.priority || null,
    owner: body.owner || null,
    owner_type: body.owner_type || "human",
    due: body.due || null,
    status: body.status || "todo",
    stage: body.stage || "proposed",
    blocked: false,
    blocker_reason: null,
    acceptance_criteria: body.acceptance_criteria || [],
    parent_task_id: body.parent_task_id || null,
    created_by: body.created_by || "human",
    created_at: now,
    updated_at: now,
  };

  mockStore.tasks.set(task.id, task);

  // Auto-sync to Notion if configured
  let notionSync = null;
  const shouldSync = body.sync_to_notion !== false && isNotionConfigured();
  const databaseId = body.notion_database_id || process.env.NOTION_DEFAULT_DATABASE_ID;

  if (shouldSync && databaseId) {
    // First, sync all existing unsynced tasks
    const allTasks = Array.from(mockStore.tasks.values()) as TaskWithNotion[];
    const unsyncedTasks = allTasks.filter(t => !t.notion_page_id && t.id !== task.id);

    for (const unsyncedTask of unsyncedTasks) {
      const result = await syncTaskToNotion(unsyncedTask, databaseId);
      if (result.success && result.notion_page_id) {
        unsyncedTask.notion_page_id = result.notion_page_id;
      }
    }

    // Now sync the new task
    const result = await syncTaskToNotion(task, databaseId);

    if (result.success) {
      notionSync = {
        success: true,
        notion_page_id: result.notion_page_id,
        notion_url: result.notion_url,
        synced_at: now,
        also_synced: unsyncedTasks.length
      };

      // Store notion_page_id in the task
      const extendedTask = mockStore.tasks.get(task.id) as TaskWithNotion;
      if (extendedTask) {
        extendedTask.notion_page_id = result.notion_page_id;
      }
    } else {
      notionSync = {
        success: false,
        error: result.error
      };
    }
  }

  return NextResponse.json({
    task,
    notion_sync: notionSync
  });
}
