import { NextRequest, NextResponse } from "next/server";
import { getTaskById, getProject, updateTaskNotionPage } from "@/lib/db";
import { createNotionPage, isNotionConfigured } from "@/lib/notion-api";

export async function POST(request: NextRequest) {
  try {
    // Check if Notion is configured
    if (!isNotionConfigured()) {
      return NextResponse.json(
        { error: "Notion is not configured. Set NOTION_TOKEN in environment." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { task_id, database_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    // Get the task
    const task = getTaskById(task_id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get the project to check for default database
    const project = getProject(task.project_id);
    const targetDatabaseId = database_id || project?.notion_database_id || process.env.NOTION_DEFAULT_DATABASE_ID;

    if (!targetDatabaseId) {
      return NextResponse.json(
        { error: "No Notion database configured. Set database_id in request, project settings, or NOTION_DEFAULT_DATABASE_ID." },
        { status: 400 }
      );
    }

    // Check if task is already synced
    if (task.notion_page_id) {
      return NextResponse.json({
        success: true,
        message: "Task already synced to Notion",
        notion_page_id: task.notion_page_id,
        already_synced: true
      });
    }

    // Create the page in Notion using direct API
    const notionPage = await createNotionPage({
      database_id: targetDatabaseId,
      title: task.title
    });

    // Update task with Notion page ID
    updateTaskNotionPage(task.id, notionPage.id);

    return NextResponse.json({
      success: true,
      message: "Task synced to Notion",
      notion_page_id: notionPage.id,
      notion_url: notionPage.url,
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error pushing task to Notion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push task to Notion" },
      { status: 500 }
    );
  }
}
