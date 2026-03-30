/**
 * Direct Notion API Client
 * Simpler alternative to MCP for reliable task syncing
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

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
    people?: string;  // Changed from owner
    due_date?: string;
    description?: string;
    momentum_id?: string;
  };
}

async function notionFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN is not configured');
  }

  const response = await fetch(`${NOTION_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Notion API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a page in a Notion database with full task properties
 */
export async function createNotionPage(params: CreatePageParams): Promise<NotionPage> {
  const properties: Record<string, unknown> = {
    // Title is required
    Name: {
      title: [{ text: { content: params.title } }]
    }
  };

  // Add optional properties if provided
  // These will only work if the corresponding columns exist in Notion
  if (params.properties) {
    // Status - Native Notion status type (not select)
    if (params.properties.status) {
      properties['Status'] = {
        status: { name: params.properties.status }
      };
    }

    // Priority - Select type
    if (params.properties.priority) {
      properties['Priority'] = {
        select: { name: params.properties.priority }
      };
    }

    // Description - Rich text type
    if (params.properties.description) {
      properties['Description'] = {
        rich_text: [{ text: { content: params.properties.description } }]
      };
    }

    // Due Date - Rich text type (user's table has it as text, not date)
    if (params.properties.due_date) {
      properties['Due Date'] = {
        rich_text: [{ text: { content: params.properties.due_date } }]
      };
    }

    // People - Rich text type
    if (params.properties.people) {
      properties['People'] = {
        rich_text: [{ text: { content: params.properties.people } }]
      };
    }

    // Skip Momentum ID since it doesn't exist in user's table
  }

  const body = {
    parent: { database_id: params.database_id },
    properties
  };

  const page = await notionFetch<NotionPage>('/pages', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return page;
}

/**
 * Update a Notion page
 */
export async function updateNotionPage(pageId: string, properties: Record<string, unknown>): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
}

/**
 * Get a Notion page by ID
 */
export async function getNotionPage(pageId: string): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`);
}

/**
 * Query a Notion database
 */
export async function queryNotionDatabase(databaseId: string, filter?: Record<string, unknown>): Promise<NotionPage[]> {
  const body: Record<string, unknown> = {};
  if (filter) {
    body.filter = filter;
  }

  const result = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result.results;
}

/**
 * Search Notion workspace
 */
export async function searchNotion(query: string): Promise<NotionPage[]> {
  const result = await notionFetch<{ results: NotionPage[] }>('/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  return result.results;
}

/**
 * Check if Notion API is configured and working
 */
export async function checkNotionConnection(): Promise<boolean> {
  try {
    await notionFetch('/users/me');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Notion is configured
 */
export function isNotionConfigured(): boolean {
  return !!NOTION_TOKEN;
}
