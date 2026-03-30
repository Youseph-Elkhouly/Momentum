"use client";

import { useState, useEffect } from "react";

interface NotionStatus {
  configured: boolean;
  connected: boolean;
  mcp_url?: string;
  default_database_id?: string;
  message?: string;
  error?: string;
}

interface NotionConnectPanelProps {
  projectId: string;
  notionDatabaseId?: string;
  onDatabaseChange?: (databaseId: string) => void;
}

export function NotionConnectPanel({
  projectId,
  notionDatabaseId,
  onDatabaseChange,
}: NotionConnectPanelProps) {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [databaseId, setDatabaseId] = useState(notionDatabaseId || "");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/notion/status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        configured: false,
        connected: false,
        error: "Failed to check Notion status",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProject = async () => {
    if (!databaseId) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/notion/sync-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          database_id: databaseId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message,
        });
        onDatabaseChange?.(databaseId);
      } else {
        setSyncResult({
          success: false,
          message: data.error || "Sync failed",
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-neutral-700 rounded" />
          <div className="h-4 bg-neutral-700 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotionIcon className="w-5 h-5" />
          <span className="font-medium">Notion MCP</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {!status?.configured && (
        <div className="text-sm text-neutral-400 space-y-2">
          <p>Notion MCP is not configured. To enable:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>
              Create a Notion integration at{" "}
              <a
                href="https://www.notion.so/profile/integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                notion.so/profile/integrations
              </a>
            </li>
            <li>Add NOTION_TOKEN to your .env.local</li>
            <li>
              Run:{" "}
              <code className="bg-neutral-800 px-1 rounded">
                npx @notionhq/notion-mcp-server --transport http --port 3100
              </code>
            </li>
            <li>Restart the app</li>
          </ol>
        </div>
      )}

      {status?.configured && !status?.connected && (
        <div className="text-sm text-yellow-500">
          <p>MCP server not reachable. Make sure it&apos;s running:</p>
          <code className="block mt-2 bg-neutral-800 px-2 py-1 rounded text-xs">
            NOTION_TOKEN=ntn_xxx npx @notionhq/notion-mcp-server --transport http
            --port 3100
          </code>
        </div>
      )}

      {status?.connected && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Notion Database ID
            </label>
            <input
              type="text"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="abc123-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Find this in your Notion database URL after the workspace name
            </p>
          </div>

          <button
            onClick={handleSyncProject}
            disabled={syncing || !databaseId}
            className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
              syncing || !databaseId
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </span>
                Syncing to Notion...
              </span>
            ) : (
              "Sync All Tasks to Notion"
            )}
          </button>

          {syncResult && (
            <div
              className={`text-sm px-3 py-2 rounded ${
                syncResult.success
                  ? "bg-green-900/30 text-green-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              {syncResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: NotionStatus | null }) {
  if (!status) return null;

  if (status.connected) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        Connected
      </span>
    );
  }

  if (status.configured) {
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-400">
        <span className="w-2 h-2 bg-yellow-400 rounded-full" />
        Not Running
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-neutral-500">
      <span className="w-2 h-2 bg-neutral-500 rounded-full" />
      Not Configured
    </span>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.44 17.67c3.94 2.92 5.4 2.72 12.77 2.23l44.05-2.64c1.48 0 .25-1.48-.25-1.72l-7.38-5.42c-2.22-1.72-5.16-3.69-10.82-3.2L16.99 10.6c-2.47.25-2.96 1.48-1.97 2.47l5.42 4.6zm4.19 13.76v46.31c0 2.47 1.23 3.45 3.94 3.2l48.23-2.72c2.72-.25 2.96-1.97 2.96-4.19V28.14c0-2.22-.74-3.45-2.72-3.2l-50.45 2.96c-2.22.25-1.97 1.72-1.97 3.53zm47.5 3.7c.49 2.22 0 4.44-2.23 4.69l-2.22.49v34.27c-1.97 1.23-3.94 1.72-5.17 1.72-2.47 0-2.96-.74-4.68-2.96L40.24 48.91v23.68l4.93 1.23s0 4.44-6.15 4.44l-16.83.98c-.49-1.23 0-4.18 1.97-4.68l4.44-1.48V39.93l-6.14-.49c-.49-2.22.74-5.42 4.18-5.67l18.05-1.23 18.55 28.37V37.72l-4.19-.5c-.49-2.72 1.48-4.68 3.94-4.93l16.59-.99z"
      />
    </svg>
  );
}
