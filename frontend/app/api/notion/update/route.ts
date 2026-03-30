import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/lib/db";
import {
  updateNotionTaskStatus,
  addAgentOutputToNotion,
  updateNotionPage,
  mapColumnToNotionStatus,
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
    const { task_id, update_type, data } = body;

    if (!task_id) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    if (!update_type) {
      return NextResponse.json({ error: "update_type is required" }, { status: 400 });
    }

    // Get the task
    const task = getTaskById(task_id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if task is synced to Notion
    if (!task.notion_page_id) {
      return NextResponse.json(
        { error: "Task is not synced to Notion. Push it first using /api/notion/push-task" },
        { status: 400 }
      );
    }

    let result;

    switch (update_type) {
      case "status":
        // Update task status in Notion
        const status = data?.status || mapColumnToNotionStatus(task.column_id);
        result = await updateNotionTaskStatus(task.notion_page_id, status);
        break;

      case "agent_output":
        // Add agent output to Notion page
        if (!data?.output) {
          return NextResponse.json({ error: "data.output is required for agent_output update" }, { status: 400 });
        }
        result = await addAgentOutputToNotion(
          task.notion_page_id,
          data.output,
          data.agent_name
        );
        break;

      case "properties":
        // Update arbitrary properties
        if (!data?.properties) {
          return NextResponse.json({ error: "data.properties is required for properties update" }, { status: 400 });
        }
        result = await updateNotionPage({
          page_id: task.notion_page_id,
          properties: data.properties
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown update_type: ${update_type}. Use: status, agent_output, or properties` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Notion page updated (${update_type})`,
      notion_page_id: task.notion_page_id,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error updating Notion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update Notion" },
      { status: 500 }
    );
  }
}
