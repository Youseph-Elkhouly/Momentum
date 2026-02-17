/**
 * Backboard API Client
 * https://app.backboard.io/api/
 */

const BACKBOARD_API_URL = "https://app.backboard.io/api";
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;

interface BackboardAssistant {
  assistant_id: string;
  name: string;
  system_prompt: string;
  tools?: BackboardTool[];
  embedding_provider?: string;
  embedding_model_name?: string;
}

interface BackboardTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
}

interface BackboardThread {
  thread_id: string;
  assistant_id: string;
  created_at: string;
}

interface BackboardMessage {
  message_id: string;
  thread_id: string;
  role: "user" | "assistant";
  content?: string;
  text?: string;
  created_at: string;
}

interface BackboardMemory {
  memory_id: string;
  assistant_id: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

async function backboardFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!BACKBOARD_API_KEY) {
    throw new Error("BACKBOARD_API_KEY is not set");
  }

  const response = await fetch(`${BACKBOARD_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backboard API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============ Assistants ============

export async function createAssistant(params: {
  name: string;
  system_prompt: string;
  tools?: BackboardTool[];
  embedding_provider?: string;
  embedding_model_name?: string;
}): Promise<BackboardAssistant> {
  return backboardFetch<BackboardAssistant>("/assistants", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getAssistant(assistantId: string): Promise<BackboardAssistant> {
  return backboardFetch<BackboardAssistant>(`/assistants/${assistantId}`);
}

export async function listAssistants(): Promise<BackboardAssistant[]> {
  return backboardFetch<BackboardAssistant[]>("/assistants");
}

export async function updateAssistant(
  assistantId: string,
  params: Partial<{ name: string; system_prompt: string; tools: BackboardTool[] }>
): Promise<BackboardAssistant> {
  return backboardFetch<BackboardAssistant>(`/assistants/${assistantId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  await backboardFetch(`/assistants/${assistantId}`, {
    method: "DELETE",
  });
}

// ============ Threads ============

export async function createThread(assistantId: string): Promise<BackboardThread> {
  return backboardFetch<BackboardThread>(`/assistants/${assistantId}/threads`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getThread(threadId: string): Promise<BackboardThread> {
  return backboardFetch<BackboardThread>(`/threads/${threadId}`);
}

export async function listThreads(assistantId: string): Promise<BackboardThread[]> {
  return backboardFetch<BackboardThread[]>(`/assistants/${assistantId}/threads`);
}

export async function deleteThread(threadId: string): Promise<void> {
  await backboardFetch(`/threads/${threadId}`, {
    method: "DELETE",
  });
}

// ============ Messages ============

export async function sendMessage(
  threadId: string,
  content: string
): Promise<BackboardMessage> {
  if (!BACKBOARD_API_KEY) {
    throw new Error("BACKBOARD_API_KEY is not set");
  }

  // Backboard API requires application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append("content", content);

  const response = await fetch(`${BACKBOARD_API_URL}/threads/${threadId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backboard API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function getMessages(threadId: string): Promise<BackboardMessage[]> {
  return backboardFetch<BackboardMessage[]>(`/threads/${threadId}/messages`);
}

// ============ Memory ============

export async function saveMemory(
  assistantId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<BackboardMemory> {
  return backboardFetch<BackboardMemory>(`/assistants/${assistantId}/memory`, {
    method: "POST",
    body: JSON.stringify({ content, metadata }),
  });
}

export async function getMemory(assistantId: string): Promise<BackboardMemory[]> {
  return backboardFetch<BackboardMemory[]>(`/assistants/${assistantId}/memory`);
}

export async function deleteMemory(assistantId: string, memoryId: string): Promise<void> {
  await backboardFetch(`/assistants/${assistantId}/memory/${memoryId}`, {
    method: "DELETE",
  });
}

// ============ Documents ============

export async function uploadDocument(
  assistantId: string,
  file: File | Blob,
  filename: string
): Promise<{ document_id: string }> {
  if (!BACKBOARD_API_KEY) {
    throw new Error("BACKBOARD_API_KEY is not set");
  }

  const formData = new FormData();
  formData.append("file", file, filename);

  const response = await fetch(`${BACKBOARD_API_URL}/assistants/${assistantId}/documents`, {
    method: "POST",
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backboard API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function listDocuments(assistantId: string): Promise<{ document_id: string; filename: string }[]> {
  return backboardFetch<{ document_id: string; filename: string }[]>(
    `/assistants/${assistantId}/documents`
  );
}

export async function deleteDocument(assistantId: string, documentId: string): Promise<void> {
  await backboardFetch(`/assistants/${assistantId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

// ============ Momentum-specific helpers ============

const MOMENTUM_ASSISTANT_SYSTEM_PROMPT = `You are Momentum, an AI project management assistant. You help teams track decisions, preferences, risks, and project progress.

Your capabilities:
- Remember important decisions, preferences, and risks from conversations
- Provide context-aware answers about the project
- Help generate task plans from meeting notes
- Track project progress and identify blockers

Always be concise, helpful, and focused on actionable insights.`;

let cachedAssistantId: string | null = null;

export async function getOrCreateMomentumAssistant(): Promise<string> {
  if (cachedAssistantId) return cachedAssistantId;

  try {
    const assistants = await listAssistants();
    const existing = assistants.find((a) => a.name === "Momentum Assistant");
    if (existing) {
      cachedAssistantId = existing.assistant_id;
      return cachedAssistantId;
    }
  } catch {
    // If listing fails, try to create
  }

  const assistant = await createAssistant({
    name: "Momentum Assistant",
    system_prompt: MOMENTUM_ASSISTANT_SYSTEM_PROMPT,
    embedding_provider: "openai",
    embedding_model_name: "text-embedding-3-small",
  });

  cachedAssistantId = assistant.assistant_id;
  return cachedAssistantId;
}

export async function askMomentum(
  question: string,
  projectContext?: { goal?: string; decisions?: string[]; preferences?: string[]; risks?: string[] }
): Promise<{ answer: string; sources: string[] }> {
  const assistantId = await getOrCreateMomentumAssistant();

  // Create a thread for this question
  const thread = await createThread(assistantId);

  // Build context message
  let contextMessage = question;
  if (projectContext) {
    const contextParts: string[] = [];
    if (projectContext.goal) contextParts.push(`Project Goal: ${projectContext.goal}`);
    if (projectContext.decisions?.length) contextParts.push(`Decisions: ${projectContext.decisions.join("; ")}`);
    if (projectContext.preferences?.length) contextParts.push(`Preferences: ${projectContext.preferences.join("; ")}`);
    if (projectContext.risks?.length) contextParts.push(`Risks: ${projectContext.risks.join("; ")}`);

    if (contextParts.length > 0) {
      contextMessage = `Context:\n${contextParts.join("\n")}\n\nQuestion: ${question}`;
    }
  }

  // Send message and get response
  const response = await sendMessage(thread.thread_id, contextMessage);

  return {
    answer: response.content || response.text || "",
    sources: [], // Could be populated from memory/documents if available
  };
}

export function isBackboardConfigured(): boolean {
  return !!BACKBOARD_API_KEY;
}
