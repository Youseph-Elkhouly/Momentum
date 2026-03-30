/**
 * Notion MCP Client
 * Handles communication with the Notion MCP server for workspace sync
 */

const NOTION_MCP_URL = process.env.NOTION_MCP_URL || 'http://localhost:3100/mcp';
const NOTION_MCP_TOKEN = process.env.NOTION_MCP_TOKEN || '';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface NotionPage {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
}

interface CreatePageParams {
  database_id: string;
  title: string;
  properties?: {
    status?: string;
    priority?: string;
    owner?: string;
    due_date?: string;
    description?: string;
    momentum_id?: string;
  };
  content?: string;
}

interface UpdatePageParams {
  page_id: string;
  properties?: Record<string, unknown>;
  content?: string;
}

interface SearchParams {
  query: string;
  filter?: {
    property?: string;
    value?: string;
  };
  limit?: number;
}

let requestId = 0;

/**
 * Make a JSON-RPC call to the Notion MCP server
 */
async function mcpCall<T>(method: string, params: Record<string, unknown>): Promise<T> {
  requestId++;

  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (NOTION_MCP_TOKEN) {
    headers['Authorization'] = `Bearer ${NOTION_MCP_TOKEN}`;
  }

  const response = await fetch(NOTION_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion MCP error: ${response.status} - ${errorText}`);
  }

  const jsonResponse = await response.json() as JsonRpcResponse<T>;

  if (jsonResponse.error) {
    throw new Error(`Notion MCP error: ${jsonResponse.error.message}`);
  }

  return jsonResponse.result as T;
}

/**
 * Create a page in a Notion database
 */
export async function createNotionPage(params: CreatePageParams): Promise<NotionPage> {
  const properties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: params.title } }]
    }
  };

  // Add optional properties
  if (params.properties?.status) {
    properties['Status'] = {
      select: { name: params.properties.status }
    };
  }

  if (params.properties?.priority) {
    properties['Priority'] = {
      select: { name: params.properties.priority }
    };
  }

  if (params.properties?.owner) {
    properties['Owner'] = {
      rich_text: [{ text: { content: params.properties.owner } }]
    };
  }

  if (params.properties?.due_date) {
    properties['Due Date'] = {
      date: { start: params.properties.due_date }
    };
  }

  if (params.properties?.description) {
    properties['Description'] = {
      rich_text: [{ text: { content: params.properties.description } }]
    };
  }

  if (params.properties?.momentum_id) {
    properties['Momentum ID'] = {
      rich_text: [{ text: { content: params.properties.momentum_id } }]
    };
  }

  const result = await mcpCall<{ pages: NotionPage[] }>('notion-create-pages', {
    pages: [{
      parent: { database_id: params.database_id },
      properties
    }]
  });

  return result.pages[0];
}

/**
 * Update an existing Notion page
 */
export async function updateNotionPage(params: UpdatePageParams): Promise<NotionPage> {
  const updateParams: Record<string, unknown> = {
    page_id: params.page_id
  };

  if (params.properties) {
    updateParams.properties = params.properties;
  }

  return mcpCall<NotionPage>('notion-update-page', updateParams);
}

/**
 * Update task status in Notion
 */
export async function updateNotionTaskStatus(
  pageId: string,
  status: 'Todo' | 'In Progress' | 'Done'
): Promise<NotionPage> {
  return updateNotionPage({
    page_id: pageId,
    properties: {
      Status: {
        select: { name: status }
      }
    }
  });
}

/**
 * Add AI output to a Notion page
 */
export async function addAgentOutputToNotion(
  pageId: string,
  output: string,
  agentName?: string
): Promise<NotionPage> {
  const timestamp = new Date().toISOString();
  const header = agentName ? `AI Agent (${agentName}) - ${timestamp}` : `AI Output - ${timestamp}`;

  return updateNotionPage({
    page_id: pageId,
    properties: {
      'AI Output': {
        rich_text: [{
          text: {
            content: `${header}\n\n${output}`.slice(0, 2000) // Notion text limit
          }
        }]
      },
      'Status': {
        select: { name: 'Done' }
      }
    }
  });
}

/**
 * Search Notion workspace
 */
export async function searchNotion(params: SearchParams): Promise<NotionPage[]> {
  const result = await mcpCall<{ results: NotionPage[] }>('notion-search', {
    query: params.query,
    filter: params.filter,
    page_size: params.limit || 10
  });

  return result.results;
}

/**
 * Fetch a Notion page by ID or URL
 */
export async function fetchNotionPage(pageIdOrUrl: string): Promise<NotionPage> {
  return mcpCall<NotionPage>('notion-fetch', {
    url: pageIdOrUrl
  });
}

/**
 * Check if the MCP server is available
 */
export async function checkMcpHealth(): Promise<boolean> {
  try {
    // Try a simple call to check connectivity
    await mcpCall('notion-get-self', {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Map Momentum task column to Notion status
 */
export function mapColumnToNotionStatus(columnId: string): 'Todo' | 'In Progress' | 'Done' {
  switch (columnId) {
    case 'todo':
      return 'Todo';
    case 'doing':
      return 'In Progress';
    case 'done':
      return 'Done';
    default:
      return 'Todo';
  }
}

/**
 * Map Momentum priority to Notion priority
 */
export function mapPriorityToNotion(priority: string | null): string {
  if (!priority) return 'P2';
  return priority; // P0, P1, P2 map directly
}

/**
 * Check if Notion integration is configured
 */
export function isNotionConfigured(): boolean {
  return !!(process.env.NOTION_TOKEN || process.env.NOTION_MCP_URL);
}
