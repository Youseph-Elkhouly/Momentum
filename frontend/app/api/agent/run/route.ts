import { NextRequest, NextResponse } from "next/server";
import { OPENCLAW_CONFIG, detectTaskType, getTaskTypeConfig } from "@/lib/openclaw-config";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://localhost:5100";
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;

interface TaskContext {
  taskId: string;
  title: string;
  description: string | null;
  priority: string | null;
  memoryContext: Array<{
    title: string;
    content: string;
    type: string;
  }>;
}

interface AgentResult {
  success: boolean;
  output: string;
  steps: Array<{ name: string; status: string; output?: string }>;
  duration_ms: number;
  provider: "openclaw" | "backboard" | "mock";
  taskType: string;
  emailSent?: boolean;
  emailTo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, memories, projectName, sendEmail, emailTo } = body as {
      task: TaskContext;
      memories: Array<{ title: string; content: string; type: string }>;
      projectName: string;
      sendEmail?: boolean;
      emailTo?: string;
    };

    // Detect task type for specialized handling
    const taskType = detectTaskType(task.title, task.description);
    const taskConfig = getTaskTypeConfig(taskType);

    // Build the prompt for the agent
    const agentPrompt = buildAgentPrompt(task, memories, projectName, taskType);

    // Try OpenClaw first, then Backboard, then mock
    let result: AgentResult;

    try {
      // Try OpenClaw local gateway
      result = await runWithOpenClaw(agentPrompt, task, taskType, taskConfig.systemPrompt);
    } catch (openclawError) {
      console.log("OpenClaw not available:", openclawError);

      try {
        // Fall back to Backboard API
        result = await runWithBackboard(agentPrompt, task, taskType);
      } catch (backboardError) {
        console.log("Backboard not available:", backboardError);
        // Fall back to mock response for demo
        result = generateMockResponse(task, taskType, memories);
      }
    }

    // If this is an email task and sendEmail is true, actually send the email
    if (taskType === "write-email" && sendEmail && emailTo) {
      try {
        const emailContent = parseEmailFromOutput(result.output);
        const emailResponse = await fetch(new URL("/api/email/send", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: emailTo,
            subject: emailContent.subject,
            body: emailContent.body,
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          result.emailSent = true;
          result.emailTo = emailTo;
          result.steps.push({
            name: "Send email",
            status: "success",
            output: `Sent to ${emailTo} via ${emailResult.provider}`,
          });
          result.output += `\n\n---\nEmail sent to ${emailTo} (via ${emailResult.provider})`;
        } else {
          result.steps.push({
            name: "Send email",
            status: "failed",
            output: emailResult.error || "Failed to send",
          });
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
        result.steps.push({
          name: "Send email",
          status: "failed",
          output: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run agent" },
      { status: 500 }
    );
  }
}

/**
 * Parse email subject and body from generated output
 */
function parseEmailFromOutput(output: string): { subject: string; body: string } {
  // Try to find subject line
  const subjectMatch = output.match(/\*\*Subject:\*\*\s*(.+?)(?:\n|$)/i) ||
                       output.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : "Update from Momentum";

  // Remove the subject line and any demo mode headers for the body
  let body = output
    .replace(/\*\*\[DEMO MODE.*?\]\*\*\n*---\n*/gi, "")
    .replace(/\*\*Subject:\*\*\s*.+?\n/gi, "")
    .replace(/Subject:\s*.+?\n/gi, "")
    .replace(/---\n*$/g, "")
    .trim();

  return { subject, body };
}

function buildAgentPrompt(
  task: TaskContext,
  memories: Array<{ title: string; content: string; type: string }>,
  projectName: string,
  taskType: string
): string {
  const memorySection = memories.length > 0
    ? memories.map(m => `- [${m.type}] ${m.title}: ${m.content}`).join("\n")
    : "No related memories.";

  // Special prompt for email tasks
  if (taskType === "write-email") {
    return `
Project: "${projectName}"

## Email Task
**${task.title}**
${task.description || "Write a professional email based on the task title."}

## Context
${memorySection}

## Instructions
Please write a complete email including:
1. Subject line
2. Professional greeting
3. Clear, well-structured body
4. Sign off with "Best regards," followed by "Momentum Project Management Team"

Keep the tone professional but friendly. Do NOT use placeholders like [Your Name] - use the team name provided above.
`;
  }

  // Default prompt for other task types
  return `
You are an AI agent working on the project "${projectName}".

## Task to Complete
**${task.title}**
${task.description || "No additional description provided."}
Priority: ${task.priority || "Not set"}

## Relevant Context from Memory
${memorySection}

## Instructions
Please complete this task. Provide:
1. A clear summary of what you did
2. Any code changes or artifacts created
3. Test results if applicable
4. Recommendations for next steps

Be specific and actionable.
`;
}

async function runWithOpenClaw(
  prompt: string,
  task: TaskContext,
  taskType: string,
  systemPrompt: string
): Promise<AgentResult> {
  const startTime = Date.now();

  // Use OpenClaw CLI agent command
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Find OpenClaw binary
  const openclawPath = process.env.OPENCLAW_PATH ||
    `${process.env.HOME}/.npm-global/bin/openclaw`;

  // Escape the prompt for shell
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  try {
    // Run OpenClaw agent with the prompt
    const { stdout, stderr } = await execAsync(
      `${openclawPath} agent --local --message '${escapedPrompt}' --thinking medium --json`,
      {
        timeout: OPENCLAW_CONFIG.timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      }
    );

    let output: string;
    try {
      // Try to parse JSON response
      const result = JSON.parse(stdout);
      output = result.content || result.message || result.response || stdout;
    } catch {
      // If not JSON, use raw output
      output = stdout || stderr || "No response from OpenClaw";
    }

    return {
      success: true,
      output,
      steps: [
        { name: "Detect task type", status: "success", output: `Type: ${taskType}` },
        { name: "Connect to OpenClaw", status: "success", output: "Local gateway connected" },
        { name: "Execute with AI", status: "success", output: "Completed via OpenClaw agent" },
        { name: "Generate output", status: "success", output: output.slice(0, 100) + "..." },
      ],
      duration_ms: Date.now() - startTime,
      provider: "openclaw",
      taskType,
    };
  } catch (error) {
    // If OpenClaw CLI fails, throw to fall back to next provider
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("OpenClaw CLI error:", errMsg);
    throw new Error(`OpenClaw CLI error: ${errMsg}`);
  }
}

async function runWithBackboard(
  prompt: string,
  task: TaskContext,
  taskType: string
): Promise<AgentResult> {
  if (!BACKBOARD_API_KEY) {
    throw new Error("No BACKBOARD_API_KEY configured");
  }

  const startTime = Date.now();

  // Get or create assistant
  const assistantsRes = await fetch("https://app.backboard.io/api/assistants", {
    headers: { "X-API-Key": BACKBOARD_API_KEY },
  });
  const assistants = await assistantsRes.json();
  const assistant = assistants.find((a: { name: string }) => a.name === "Momentum Assistant") || assistants[0];

  if (!assistant) {
    throw new Error("No assistant found");
  }

  // Create thread
  const threadRes = await fetch(`https://app.backboard.io/api/assistants/${assistant.assistant_id}/threads`, {
    method: "POST",
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const thread = await threadRes.json();

  // Send message
  const params = new URLSearchParams();
  params.append("content", prompt);

  const messageRes = await fetch(`https://app.backboard.io/api/threads/${thread.thread_id}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!messageRes.ok) {
    const error = await messageRes.text();
    throw new Error(`Backboard error: ${error}`);
  }

  const message = await messageRes.json();
  const output = message.content || "Task completed";

  return {
    success: true,
    output,
    steps: [
      { name: "Detect task type", status: "success", output: `Type: ${taskType}` },
      { name: "Analyze task", status: "success", output: "Task requirements understood" },
      { name: "Search memory", status: "success", output: "Retrieved relevant context" },
      { name: "Execute with AI", status: "success", output: "Completed via Backboard" },
      { name: "Generate output", status: "success", output: output.slice(0, 100) + "..." },
    ],
    duration_ms: Date.now() - startTime,
    provider: "backboard",
    taskType,
  };
}

/**
 * Generate a mock response when no AI provider is available
 * This allows the demo to work without any API keys configured
 */
function generateMockResponse(
  task: TaskContext,
  taskType: string,
  memories: Array<{ title: string; content: string; type: string }>
): AgentResult {
  const startTime = Date.now();

  let output: string;

  switch (taskType) {
    case "write-email":
      output = generateMockEmail(task);
      break;
    case "code-review":
      output = generateMockCodeReview(task);
      break;
    case "write-docs":
      output = generateMockDocs(task);
      break;
    case "break-down-task":
      output = generateMockTaskBreakdown(task);
      break;
    default:
      output = generateMockGeneral(task, memories);
  }

  return {
    success: true,
    output,
    steps: [
      { name: "Detect task type", status: "success", output: `Type: ${taskType}` },
      { name: "Analyze task", status: "success", output: "Task requirements understood" },
      { name: "Generate output", status: "success", output: "Generated demo response" },
    ],
    duration_ms: Date.now() - startTime,
    provider: "mock",
    taskType,
  };
}

function generateMockEmail(task: TaskContext): string {
  const subject = task.title.replace(/write email|draft email|email/gi, "").trim() || "Follow-up";
  return `[DEMO MODE - Configure OpenClaw or Backboard for real AI responses]

---

Subject: ${subject}

Hi there,

I hope this email finds you well.

${task.description || `I wanted to reach out regarding "${task.title}".`}

Please let me know if you have any questions or need any clarification.

Best regards,
Momentum Team

---

Demo response. To enable real AI email generation:
1. Set up OpenClaw: pip install openclaw && openclaw serve
2. Or configure BACKBOARD_API_KEY in your .env.local file`;
}

function generateMockCodeReview(task: TaskContext): string {
  return `[DEMO MODE - Configure OpenClaw or Backboard for real AI responses]

---

CODE REVIEW: ${task.title}

Summary:
This code review covers the changes mentioned in the task.

Findings:

Security
  - No obvious security issues found in scope

Performance
  - Consider caching for frequently accessed data
  - Review N+1 query patterns

Code Quality
  - Code follows project conventions
  - Adequate error handling present

Recommendations:
1. Add unit tests for edge cases
2. Update documentation if APIs changed
3. Consider extracting reusable logic

---

Demo response. Configure AI providers for real code review.`;
}

function generateMockDocs(task: TaskContext): string {
  return `[DEMO MODE - Configure OpenClaw or Backboard for real AI responses]

---

${task.title.toUpperCase()}

Overview:
${task.description || "Documentation for the specified feature or component."}

Usage:
  import { feature } from './feature';
  feature.initialize();

API Reference:
  - initialize(): Sets up the feature
  - configure(options): Configures options

Examples:
See the /examples directory for more detailed examples.

---

Demo response. Configure AI providers for real documentation generation.`;
}

function generateMockTaskBreakdown(task: TaskContext): string {
  return `[DEMO MODE - Configure OpenClaw or Backboard for real AI responses]

---

TASK BREAKDOWN: ${task.title}

Subtasks:

1. Research & Planning (Low complexity)
   - Review existing implementation
   - Identify requirements
   - Dependencies: None

2. Implementation (Medium complexity)
   - Write core functionality
   - Add error handling
   - Dependencies: Research & Planning

3. Testing (Medium complexity)
   - Write unit tests
   - Manual testing
   - Dependencies: Implementation

4. Documentation (Low complexity)
   - Update README
   - Add code comments
   - Dependencies: Implementation

5. Review & Deploy (Low complexity)
   - Code review
   - Deploy to staging
   - Dependencies: Testing, Documentation

---

Demo response. Configure AI providers for intelligent task breakdown.`;
}

function generateMockGeneral(
  task: TaskContext,
  memories: Array<{ title: string; content: string; type: string }>
): string {
  const memoryContext = memories.length > 0
    ? `\n\nRelevant Context:\n${memories.slice(0, 3).map(m => `  - ${m.title}`).join("\n")}`
    : "";

  return `[DEMO MODE - Configure OpenClaw or Backboard for real AI responses]

---

TASK COMPLETED: ${task.title}

Summary:
The task "${task.title}" has been analyzed and processed.

${task.description ? `Description: ${task.description}` : ""}
${task.priority ? `Priority: ${task.priority}` : ""}
${memoryContext}

What was done:
1. Analyzed task requirements
2. Reviewed relevant project context
3. Generated this summary

Recommendations:
1. Review the output and provide feedback
2. Consider breaking this into smaller tasks if complex
3. Update project memory with any decisions made

---

To enable real AI task completion:
1. Install OpenClaw: pip install openclaw
2. Start the gateway: openclaw serve
3. Or set BACKBOARD_API_KEY in .env.local`;
}
