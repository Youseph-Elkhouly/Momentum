import { NextRequest, NextResponse } from "next/server";
import { queryNotionDatabase, isNotionConfigured } from "@/lib/notion-api";
import { mockStore } from "@/lib/mock-data";
import type { Task } from "@/lib/types";

interface NotionTaskProperties {
  Name?: {
    title?: Array<{ plain_text: string }>;
  };
  Status?: {
    status?: { name: string };  // Notion's native status type
    select?: { name: string };  // Fallback for select type
  };
  Priority?: {
    select?: { name: string };
  };
  People?: {
    rich_text?: Array<{ plain_text: string }>;
  };
  "Due Date"?: {
    date?: { start: string };
  };
  Description?: {
    rich_text?: Array<{ plain_text: string }>;
  };
  "Momentum ID"?: {
    rich_text?: Array<{ plain_text: string }>;
  };
}

function extractTitle(properties: NotionTaskProperties): string {
  return properties.Name?.title?.[0]?.plain_text || "Untitled";
}

function extractText(richText: Array<{ plain_text: string }> | undefined): string | null {
  return richText?.[0]?.plain_text || null;
}

function mapNotionStatusToMomentum(status: string | undefined): "todo" | "doing" | "done" {
  if (!status) return "todo";
  const lower = status.toLowerCase();
  // Map Notion status values to Momentum
  if (lower.includes("progress") || lower.includes("doing")) return "doing";
  if (lower.includes("done") || lower.includes("complete")) return "done";
  // "Not started" maps to "todo"
  return "todo";
}

function extractNotionStatus(properties: NotionTaskProperties): string | undefined {
  // Notion has a native "status" type that's different from "select"
  return properties.Status?.status?.name || properties.Status?.select?.name;
}

export async function POST(request: NextRequest) {
  try {
    if (!isNotionConfigured()) {
      return NextResponse.json(
        { error: "Notion is not configured" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const projectId = body.project_id || "proj-demo";
    const databaseId = body.database_id || process.env.NOTION_DEFAULT_DATABASE_ID;

    // Accept existing titles from frontend to prevent duplicates
    const frontendTitles: string[] = body.existing_titles || [];
    const frontendTitlesLower = new Set(frontendTitles.map((t: string) => t.toLowerCase()));

    if (!databaseId) {
      return NextResponse.json(
        { error: "No Notion database configured" },
        { status: 400 }
      );
    }

    // Fetch all pages from Notion database
    const notionPages = await queryNotionDatabase(databaseId);

    // Get existing tasks from mockStore and their Notion IDs
    const existingTasks = Array.from(mockStore.tasks.values());
    const existingNotionIds = new Set(
      existingTasks
        .filter((t) => (t as Task & { notion_page_id?: string }).notion_page_id)
        .map((t) => (t as Task & { notion_page_id?: string }).notion_page_id)
    );

    // Combine mockStore titles with frontend titles for complete deduplication
    const allExistingTitles = new Set([
      ...existingTasks.map((t) => t.title.toLowerCase()),
      ...Array.from(frontendTitlesLower)
    ]);

    // Find new tasks from Notion (not already in Momentum)
    const newTasks: Task[] = [];
    const skippedTasks: string[] = [];
    const now = new Date().toISOString();

    for (const page of notionPages) {
      const properties = page.properties as unknown as NotionTaskProperties;
      const title = extractTitle(properties);

      // Skip if we already have this Notion page by ID
      if (existingNotionIds.has(page.id)) {
        skippedTasks.push(`${title} (already synced)`);
        continue;
      }

      // Skip if title matches an existing task (avoid duplicates)
      if (allExistingTitles.has(title.toLowerCase())) {
        skippedTasks.push(`${title} (title exists)`);
        continue;
      }

      // Map Notion priority to valid TaskPriority
      const notionPriority = properties.Priority?.select?.name;
      const priority = notionPriority && ["P0", "P1", "P2", "P3"].includes(notionPriority)
        ? (notionPriority as "P0" | "P1" | "P2" | "P3")
        : null;

      // Extract status using the helper function (handles both status and select types)
      const notionStatus = extractNotionStatus(properties);

      const task: Task & { notion_page_id: string; source: string } = {
        id: mockStore.generateId("task"),
        project_id: projectId,
        title,
        description: extractText(properties.Description?.rich_text),
        priority,
        owner: extractText(properties.People?.rich_text),  // Changed from Owner to People
        owner_type: "human",
        due: properties["Due Date"]?.date?.start || null,
        status: mapNotionStatusToMomentum(notionStatus),
        stage: "proposed",
        blocked: false,
        blocker_reason: null,
        acceptance_criteria: [],
        parent_task_id: null,
        created_by: "human",
        created_at: page.created_time || now,
        updated_at: page.last_edited_time || now,
        notion_page_id: page.id,
        source: "notion", // Track that this came from Notion
      };

      mockStore.tasks.set(task.id, task);
      newTasks.push(task);
    }

    return NextResponse.json({
      success: true,
      message: `Pulled ${newTasks.length} new tasks from Notion (${skippedTasks.length} skipped)`,
      new_tasks: newTasks,
      skipped_count: skippedTasks.length,
      skipped_tasks: skippedTasks,
      total_notion_tasks: notionPages.length,
      total_momentum_tasks: mockStore.tasks.size,
    });
  } catch (error) {
    console.error("Error pulling tasks from Notion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to pull tasks from Notion" },
      { status: 500 }
    );
  }
}
