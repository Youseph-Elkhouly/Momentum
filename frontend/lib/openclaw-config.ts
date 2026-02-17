/**
 * OpenClaw Configuration
 *
 * OpenClaw is a local AI gateway that routes requests to various LLM providers.
 * It supports running agents locally with tool use capabilities.
 *
 * Setup:
 * 1. Install: pip install openclaw
 * 2. Configure: openclaw config (set your API keys)
 * 3. Run: openclaw serve
 *
 * The gateway will be available at http://localhost:5100
 */

export const OPENCLAW_CONFIG = {
  // Gateway URL
  url: process.env.OPENCLAW_URL || "http://localhost:5100",

  // Default model to use
  defaultModel: "gpt-4o",

  // Timeout for requests (ms)
  timeout: 60000,

  // Task type configurations
  taskTypes: {
    // Simple email writing task
    "write-email": {
      systemPrompt: `You are an email writing assistant. Write professional, clear, and concise emails based on the user's requirements.
Always include:
- A clear subject line suggestion
- Professional greeting
- Well-structured body
- Appropriate closing

Keep the tone professional but friendly unless otherwise specified.`,
      maxTokens: 1000,
    },

    // Code review task
    "code-review": {
      systemPrompt: `You are a code review assistant. Analyze code for:
- Bugs and potential issues
- Security vulnerabilities
- Performance improvements
- Code style and best practices
- Suggestions for refactoring

Be constructive and specific in your feedback.`,
      maxTokens: 2000,
    },

    // Documentation task
    "write-docs": {
      systemPrompt: `You are a documentation writer. Create clear, comprehensive documentation that includes:
- Overview/Introduction
- Usage examples
- API reference (if applicable)
- Common use cases
- Troubleshooting tips

Use markdown formatting for better readability.`,
      maxTokens: 2000,
    },

    // Task breakdown
    "break-down-task": {
      systemPrompt: `You are a project planning assistant. Break down complex tasks into smaller, actionable subtasks.
For each subtask, provide:
- Clear title
- Brief description
- Estimated complexity (low/medium/high)
- Dependencies on other subtasks

Organize subtasks in logical execution order.`,
      maxTokens: 1500,
    },

    // General task (default)
    "general": {
      systemPrompt: `You are a helpful AI assistant that completes software development tasks.
Provide clear, actionable responses with:
1. A summary of what you did
2. Any code or artifacts created
3. Recommendations for next steps`,
      maxTokens: 2000,
    },
  },
} as const;

export type TaskType = keyof typeof OPENCLAW_CONFIG.taskTypes;

/**
 * Get the configuration for a specific task type
 */
export function getTaskTypeConfig(taskType: TaskType | string) {
  return OPENCLAW_CONFIG.taskTypes[taskType as TaskType] || OPENCLAW_CONFIG.taskTypes.general;
}

/**
 * Check if OpenClaw is available
 */
export async function checkOpenClawHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCLAW_CONFIG.url}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Detect task type from task title/description
 */
export function detectTaskType(title: string, description?: string | null): TaskType {
  const text = `${title} ${description || ""}`.toLowerCase();

  if (text.includes("email") || text.includes("write email") || text.includes("draft email")) {
    return "write-email";
  }
  if (text.includes("review") || text.includes("code review") || text.includes("pr review")) {
    return "code-review";
  }
  if (text.includes("document") || text.includes("docs") || text.includes("readme")) {
    return "write-docs";
  }
  if (text.includes("break down") || text.includes("subtask") || text.includes("split")) {
    return "break-down-task";
  }

  return "general";
}
