import { NextRequest, NextResponse } from "next/server";
import { createNotionPage, queryNotionDatabase, isNotionConfigured } from "@/lib/notion-api";

interface PushTaskRequest {
  project_id?: string;
  database_id?: string;
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    status?: string;
    priority?: string | null;
    owner?: string | null;
    due?: string | null;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    if (!isNotionConfigured()) {
      return NextResponse.json(
        { error: "Notion is not configured" },
        { status: 400 }
      );
    }

    const body: PushTaskRequest = await request.json();
    const databaseId = body.database_id || process.env.NOTION_DEFAULT_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json(
        { error: "No Notion database configured" },
        { status: 400 }
      );
    }

    if (!body.tasks || body.tasks.length === 0) {
      return NextResponse.json(
        { error: "No tasks to sync" },
        { status: 400 }
      );
    }

    // Get existing pages in Notion to avoid duplicates
    const existingPages = await queryNotionDatabase(databaseId);
    const existingTitles = new Set(
      existingPages.map((page) => {
        const titleProp = page.properties?.Name as { title?: Array<{ plain_text: string }> } | undefined;
        return titleProp?.title?.[0]?.plain_text?.toLowerCase() || "";
      })
    );

    // Push each task that doesn't already exist in Notion
    const results: Array<{ task_id: string; title: string; success: boolean; notion_page_id?: string; error?: string }> = [];
    let syncedCount = 0;
    let skippedCount = 0;

    for (const task of body.tasks) {
      // Skip if task already exists in Notion (by title)
      if (existingTitles.has(task.title.toLowerCase())) {
        results.push({
          task_id: task.id,
          title: task.title,
          success: true,
          error: "Already exists in Notion"
        });
        skippedCount++;
        continue;
      }

      try {
        // Map Momentum status to Notion status (matching Notion's exact values)
        const statusMap: Record<string, string> = {
          'todo': 'Not started',
          'doing': 'In progress',
          'done': 'Done'
        };

        const notionPage = await createNotionPage({
          database_id: databaseId,
          title: task.title,
          properties: {
            status: task.status ? statusMap[task.status] || task.status : undefined,
            priority: task.priority || undefined,
            description: task.description || undefined,
            people: task.owner || undefined,
            due_date: task.due || undefined,
          }
        });

        results.push({
          task_id: task.id,
          title: task.title,
          success: true,
          notion_page_id: notionPage.id,
        });
        syncedCount++;

        // Add to existing titles to prevent duplicates within this batch
        existingTitles.add(task.title.toLowerCase());
      } catch (error) {
        results.push({
          task_id: task.id,
          title: task.title,
          success: false,
          error: error instanceof Error ? error.message : "Failed to create page",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pushed ${syncedCount} tasks to Notion (${skippedCount} already existed)`,
      synced_count: syncedCount,
      skipped_count: skippedCount,
      total_tasks: body.tasks.length,
      results,
    });
  } catch (error) {
    console.error("Error pushing tasks to Notion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push tasks to Notion" },
      { status: 500 }
    );
  }
}
