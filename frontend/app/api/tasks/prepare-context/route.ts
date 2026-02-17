import { NextResponse } from "next/server";
import * as backboardClient from "@/lib/backboard-client";

interface TaskData {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  owner?: string;
  due?: string;
}

interface MemoryData {
  id: string;
  content: string;
  type?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { task, selectedMemory } = body as {
      task: TaskData;
      selectedMemory: MemoryData[];
    };

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }

    // Check if Backboard is configured
    if (!backboardClient.isBackboardConfigured()) {
      // Fall back to simple text format without Backboard
      const contextText = buildContextText(task, selectedMemory);
      return NextResponse.json({
        success: true,
        contextText,
        backboardUsed: false,
      });
    }

    try {
      // Get or create Momentum assistant
      const assistantId = await backboardClient.getOrCreateMomentumAssistant();

      // Save selected memory items to Backboard for this context
      const savedMemoryIds: string[] = [];
      for (const mem of selectedMemory) {
        try {
          const saved = await backboardClient.saveMemory(assistantId, mem.content, {
            type: mem.type || "context",
            taskId: task.id,
            originalId: mem.id,
          });
          savedMemoryIds.push(saved.memory_id);
        } catch (e) {
          console.error("Failed to save memory to Backboard:", e);
        }
      }

      // Create a thread for this task
      const thread = await backboardClient.createThread(assistantId);

      // Build the context text
      const contextText = buildContextText(task, selectedMemory);

      return NextResponse.json({
        success: true,
        contextText,
        backboardUsed: true,
        assistantId,
        threadId: thread.thread_id,
        savedMemoryCount: savedMemoryIds.length,
      });
    } catch (backboardError) {
      console.error("Backboard error, falling back:", backboardError);
      // Fall back to simple text format
      const contextText = buildContextText(task, selectedMemory);
      return NextResponse.json({
        success: true,
        contextText,
        backboardUsed: false,
        error: backboardError instanceof Error ? backboardError.message : "Backboard unavailable",
      });
    }
  } catch (error) {
    console.error("Error preparing task context:", error);
    return NextResponse.json(
      { error: "Failed to prepare context" },
      { status: 500 }
    );
  }
}

function buildContextText(task: TaskData, memory: MemoryData[]): string {
  const lines: string[] = [];

  // Task details
  lines.push("# Task");
  lines.push(`**${task.title}**`);
  if (task.description) lines.push(task.description);
  if (task.priority) lines.push(`Priority: ${task.priority}`);
  if (task.owner) lines.push(`Owner: ${task.owner}`);
  if (task.due) lines.push(`Due: ${task.due}`);

  // Context from memory
  if (memory.length > 0) {
    lines.push("");
    lines.push("# Project Context");

    // Group by type
    const grouped: Record<string, string[]> = {};
    for (const mem of memory) {
      const type = mem.type || "other";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(mem.content);
    }

    const typeLabels: Record<string, string> = {
      decision: "Decisions",
      preference: "Preferences",
      risk: "Risks",
      summary: "Summary",
      requirement: "Requirements",
      other: "Other Context",
    };

    for (const [type, items] of Object.entries(grouped)) {
      lines.push("");
      lines.push(`## ${typeLabels[type] || type}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
    }
  }

  return lines.join("\n");
}
