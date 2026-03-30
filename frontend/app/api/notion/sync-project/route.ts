import { NextRequest, NextResponse } from "next/server";
import { getProject, getTasks, updateTaskNotionPage, updateProjectNotionDatabase } from "@/lib/db";
import {
  createNotionPage,
  mapColumnToNotionStatus,
  mapPriorityToNotion,
  isNotionConfigured
} from "@/lib/notion-mcp";

export async function POST(request: NextRequest) {
  try {
    if (!isNotionConfigured()) {
      return NextResponse.json(
        { error: "Notion MCP is not configured" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { project_id, database_id, sync_all } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Get the project
    const project = getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Determine target database
    const targetDatabaseId = database_id || project.notion_database_id || process.env.NOTION_DEFAULT_DATABASE_ID;

    if (!targetDatabaseId) {
      return NextResponse.json(
        { error: "No Notion database configured for this project" },
        { status: 400 }
      );
    }

    // Update project's Notion database ID if provided
    if (database_id && database_id !== project.notion_database_id) {
      updateProjectNotionDatabase(project_id, database_id);
    }

    // Get tasks to sync
    const allTasks = getTasks(project_id);
    const tasksToSync = sync_all
      ? allTasks
      : allTasks.filter(t => !t.notion_page_id);

    if (tasksToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All tasks are already synced",
        synced_count: 0,
        total_tasks: allTasks.length
      });
    }

    // Sync each task
    const results: { task_id: string; notion_page_id: string; success: boolean; error?: string }[] = [];

    for (const task of tasksToSync) {
      try {
        // Skip if already synced and not forcing sync_all
        if (task.notion_page_id && !sync_all) {
          results.push({
            task_id: task.id,
            notion_page_id: task.notion_page_id,
            success: true
          });
          continue;
        }

        const notionPage = await createNotionPage({
          database_id: targetDatabaseId,
          title: task.title,
          properties: {
            status: mapColumnToNotionStatus(task.column_id),
            priority: mapPriorityToNotion(task.priority),
            owner: task.owner || undefined,
            due_date: task.due || undefined,
            description: task.description || undefined,
            momentum_id: task.id
          }
        });

        updateTaskNotionPage(task.id, notionPage.id);

        results.push({
          task_id: task.id,
          notion_page_id: notionPage.id,
          success: true
        });

      } catch (error) {
        results.push({
          task_id: task.id,
          notion_page_id: "",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `Synced ${successCount}/${tasksToSync.length} tasks to Notion`,
      synced_count: successCount,
      failed_count: failCount,
      total_tasks: allTasks.length,
      results,
      database_id: targetDatabaseId
    });

  } catch (error) {
    console.error("Error syncing project to Notion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync project to Notion" },
      { status: 500 }
    );
  }
}
