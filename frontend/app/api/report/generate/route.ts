import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateMomentumAssistant,
  createThread,
  sendMessage,
  isBackboardConfigured,
} from "@/lib/backboard-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodes, tasks, projectName } = body;

    // Build context from memory nodes
    const memoryContext = buildMemoryContext(nodes);
    const tasksContext = buildTasksContext(tasks);

    // Try Backboard API first, fall back to mock if not available
    if (isBackboardConfigured()) {
      try {
        const assistantId = await getOrCreateMomentumAssistant();
        const thread = await createThread(assistantId);
        const response = await sendMessage(thread.thread_id, buildReportPrompt(projectName, memoryContext, tasksContext));
        const reportText = response.content || response.text || "No report generated";

        return NextResponse.json({
          report: reportText,
          threadId: thread.thread_id,
          generatedAt: new Date().toISOString(),
          source: "backboard",
        });
      } catch (apiError) {
        console.log("Backboard API unavailable, using mock response:", apiError);
        // Fall through to mock response
      }
    }

    // Generate mock report based on actual data
    const mockReport = generateMockReport(projectName, nodes, tasks);

    return NextResponse.json({
      report: mockReport,
      threadId: "mock-" + Date.now(),
      generatedAt: new Date().toISOString(),
      source: "mock",
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}

function buildReportPrompt(projectName: string, memoryContext: string, tasksContext: string): string {
  return `
You are analyzing a software development project called "${projectName || "Project"}".

## Current Memory Graph (Knowledge Base):
${memoryContext}

## Current Tasks:
${tasksContext}

## Instructions:
Generate a comprehensive Development Status Report that includes:

1. **Executive Summary** - A 2-3 sentence overview of project health and status

2. **Architecture & Technical Decisions** - Key technical choices made and their implications

3. **Current Sprint Progress** - What's being worked on, what's blocked, what's completed

4. **Risk Assessment** - Active risks and their potential impact, with mitigation suggestions

5. **Recommendations** - Top 3-5 actionable next steps based on the current state

6. **Concerns & Blockers** - Any issues that need immediate attention

Format the report in clean markdown. Be specific and reference actual items from the memory and tasks provided.
`;
}

interface NodeData {
  title: string;
  content: string;
  type: string;
  tags: string[];
  pinned: boolean;
}

interface TaskData {
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  owner: string | null;
  owner_type: string;
  due: string | null;
}

function generateMockReport(projectName: string, nodes: NodeData[], tasks: TaskData[]): string {
  const todo = tasks.filter(t => t.status === "todo");
  const doing = tasks.filter(t => t.status === "doing");
  const done = tasks.filter(t => t.status === "done");

  const decisions = nodes.filter(n => n.type === "decision");
  const risks = nodes.filter(n => n.type === "risk");
  const facts = nodes.filter(n => n.type === "fact");

  const projectTitle = projectName?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Project";
  const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  return `DEVELOPMENT STATUS REPORT: ${projectTitle.toUpperCase()}
${"=".repeat(50)}

EXECUTIVE SUMMARY
-----------------
The project is currently ${completionRate >= 70 ? "on track" : completionRate >= 40 ? "in progress" : "in early stages"} with ${completionRate}% of tasks completed. There are ${doing.length} tasks actively being worked on and ${todo.length} tasks in the backlog. ${risks.length > 0 ? `${risks.length} risk(s) have been identified that require attention.` : "No critical risks identified."}


ARCHITECTURE & TECHNICAL DECISIONS
-----------------------------------
${decisions.length > 0 ? decisions.map(d => `${d.title}
${d.content}${d.tags.length > 0 ? `\nTags: ${d.tags.join(", ")}` : ""}`).join("\n\n") : "No architectural decisions documented yet."}


CURRENT SPRINT PROGRESS
-----------------------

In Progress (${doing.length}):
${doing.length > 0 ? doing.map(t => `  - ${t.title}${t.owner ? ` (@${t.owner})` : ""} ${t.priority ? `[${t.priority}]` : ""}`).join("\n") : "  - No tasks currently in progress"}

Completed (${done.length}):
${done.length > 0 ? done.slice(0, 5).map(t => `  - ${t.title} [DONE]`).join("\n") : "  - No tasks completed yet"}
${done.length > 5 ? `  ...and ${done.length - 5} more completed tasks` : ""}

Backlog (${todo.length}):
${todo.length > 0 ? todo.slice(0, 5).map(t => `  - ${t.title} ${t.priority ? `[${t.priority}]` : ""}`).join("\n") : "  - Backlog is empty"}
${todo.length > 5 ? `  ...and ${todo.length - 5} more tasks in backlog` : ""}


RISK ASSESSMENT
---------------
${risks.length > 0 ? risks.map(r => `WARNING: ${r.title}
${r.content}
Mitigation: Review and address this risk in the next sprint planning.`).join("\n\n") : "No risks currently documented. Consider reviewing the project for potential risks."}


KEY FACTS & CONTEXT
-------------------
${facts.length > 0 ? facts.map(f => `  - ${f.title}: ${f.content}`).join("\n") : "No key facts documented."}


RECOMMENDATIONS
---------------
1. ${doing.length === 0 ? "Start working on backlog items - No tasks are currently in progress" : `Continue progress on current tasks - ${doing.length} tasks are actively being worked on`}

2. ${risks.length > 0 ? `Address identified risks - ${risks.length} risk(s) need attention, particularly: "${risks[0].title}"` : "Document potential risks - Proactive risk identification can prevent blockers"}

3. ${todo.filter(t => t.priority === "P0").length > 0 ? `Prioritize P0 tasks - ${todo.filter(t => t.priority === "P0").length} high-priority tasks in backlog` : "Review task priorities - Ensure backlog is properly prioritized"}

4. ${nodes.length < 5 ? "Build out the knowledge graph - More context will improve project visibility" : "Keep memory graph updated - Continue documenting decisions and learnings"}

5. Schedule a team sync - Review this report with the team and adjust priorities as needed


CONCERNS & BLOCKERS
-------------------
${doing.filter(t => t.priority === "P0").length > 0 ? `  - High-priority tasks in progress: ${doing.filter(t => t.priority === "P0").map(t => t.title).join(", ")}` : ""}
${risks.length > 0 ? `  - Active risks: ${risks.map(r => r.title).join(", ")}` : ""}
${todo.filter(t => !t.owner).length > 5 ? `  - Unassigned tasks: ${todo.filter(t => !t.owner).length} tasks have no owner` : ""}
${doing.length === 0 && todo.length > 0 ? "  - No active work: Tasks exist but none are in progress" : ""}
${risks.length === 0 && doing.length === 0 && todo.length === 0 ? "  - No immediate concerns identified" : ""}

${"=".repeat(50)}
Report generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Based on ${nodes.length} memory items and ${tasks.length} tasks
`;
}

function buildMemoryContext(nodes: Array<{
  title: string;
  content: string;
  type: string;
  tags: string[];
  pinned: boolean;
}>): string {
  if (!nodes || nodes.length === 0) {
    return "No memory items recorded yet.";
  }

  // Group by type
  const grouped: Record<string, typeof nodes> = {};
  for (const node of nodes) {
    if (!grouped[node.type]) grouped[node.type] = [];
    grouped[node.type].push(node);
  }

  const sections: string[] = [];

  const typeLabels: Record<string, string> = {
    decision: "Decisions",
    fact: "Facts",
    preference: "Preferences",
    risk: "Risks",
    note: "Notes",
    link: "Links & Resources",
    file: "Files",
  };

  for (const [type, items] of Object.entries(grouped)) {
    const label = typeLabels[type] || type;
    const itemList = items
      .map((item) => {
        const pinned = item.pinned ? " [PINNED]" : "";
        const tags = item.tags.length > 0 ? ` (${item.tags.join(", ")})` : "";
        return `- **${item.title}**${pinned}${tags}: ${item.content}`;
      })
      .join("\n");
    sections.push(`### ${label}\n${itemList}`);
  }

  return sections.join("\n\n");
}

function buildTasksContext(tasks: Array<{
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  owner: string | null;
  owner_type: string;
  due: string | null;
}>): string {
  if (!tasks || tasks.length === 0) {
    return "No tasks created yet.";
  }

  // Group by status
  const todo = tasks.filter((t) => t.status === "todo");
  const doing = tasks.filter((t) => t.status === "doing");
  const done = tasks.filter((t) => t.status === "done");

  const formatTask = (t: typeof tasks[0]) => {
    const priority = t.priority ? `[${t.priority}]` : "";
    const owner = t.owner ? `@${t.owner}` : "Unassigned";
    const due = t.due ? `Due: ${t.due}` : "";
    const desc = t.description ? ` - ${t.description}` : "";
    return `- ${priority} **${t.title}** (${owner}) ${due}${desc}`;
  };

  const sections: string[] = [];

  if (doing.length > 0) {
    sections.push(`### In Progress (${doing.length})\n${doing.map(formatTask).join("\n")}`);
  }
  if (todo.length > 0) {
    sections.push(`### To Do (${todo.length})\n${todo.map(formatTask).join("\n")}`);
  }
  if (done.length > 0) {
    sections.push(`### Completed (${done.length})\n${done.map(formatTask).join("\n")}`);
  }

  return sections.join("\n\n");
}
