"use client";

import { useState } from "react";
import { useLocalStore } from "@/lib/local-store";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

type ProviderType = IntegrationConnection["provider"];

const AVAILABLE_INTEGRATIONS: {
  id: ProviderType;
  name: string;
  description: string;
  permissions: string[];
}[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories, sync issues, and deploy code",
    permissions: ["repo:read", "repo:write", "issues:read", "issues:write", "pr:read", "pr:write"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Receive notifications and interact with agents via chat",
    permissions: ["chat:write", "users:read", "channels:read"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync documentation and knowledge base",
    permissions: ["pages:read", "pages:write", "databases:read"],
  },
  {
    id: "linear",
    name: "Linear",
    description: "Sync issues and project management",
    permissions: ["issues:read", "issues:write", "projects:read"],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Sync documents and files",
    permissions: ["files:read", "files:write"],
  },
  {
    id: "jira",
    name: "Jira",
    description: "Sync issues and project tracking",
    permissions: ["issues:read", "issues:write", "projects:read"],
  },
];

const providerIcons: Record<ProviderType, string> = {
  github: "🔗",
  slack: "💬",
  notion: "📝",
  linear: "📊",
  google_drive: "📁",
  jira: "🎫",
};

const statusConfig: Record<IntegrationStatus, { label: string; bg: string; text: string; dot: string }> = {
  connected: { label: "Connected", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  disconnected: { label: "Disconnected", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  error: { label: "Error", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function formatTimeAgo(date: string | null): string {
  if (!date) return "Never";
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleDateString();
}

function IntegrationCard({
  provider,
  connection,
}: {
  provider: (typeof AVAILABLE_INTEGRATIONS)[0];
  connection?: IntegrationConnection;
}) {
  const { dispatch, state } = useLocalStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const isConnected = connection?.status === "connected";
  const config = connection ? statusConfig[connection.status] : null;

  const handleConnect = () => {
    setIsConnecting(true);
    // Mock OAuth flow
    setTimeout(() => {
      const newConnection: IntegrationConnection = {
        id: `int-${Date.now()}`,
        project_id: state.currentProjectId || "",
        provider: provider.id,
        name: provider.name,
        status: "connected",
        permissions: provider.permissions.slice(0, 3), // Mock: grant first 3 permissions
        last_sync_at: new Date().toISOString(),
        config: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dispatch({ type: "UPDATE_INTEGRATION", payload: newConnection });
      setIsConnecting(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    if (connection) {
      dispatch({
        type: "UPDATE_INTEGRATION",
        payload: {
          ...connection,
          status: "disconnected",
          permissions: [],
          last_sync_at: null,
          updated_at: new Date().toISOString(),
        },
      });
    }
  };

  const handleSync = () => {
    if (connection) {
      dispatch({
        type: "UPDATE_INTEGRATION",
        payload: {
          ...connection,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }
  };

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-colors ${
      isConnected ? "border-green-200" : "border-border"
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
            isConnected ? "bg-green-50" : "bg-hover-bg"
          }`}>
            {providerIcons[provider.id]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{provider.name}</span>
              {config && (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-1 ${config.bg} ${config.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </span>
              )}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">{provider.description}</div>

            {/* Sync info */}
            {isConnected && connection && (
              <div className="text-[10px] text-text-secondary mt-2">
                Last synced: {formatTimeAgo(connection.last_sync_at)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button
                  onClick={handleSync}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-hover-bg rounded-lg transition-colors"
                  title="Sync now"
                  aria-label="Sync now"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-text-primary rounded-lg hover:bg-text-primary/90 transition-colors disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* Permissions (for connected integrations) */}
        {isConnected && connection && connection.permissions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showPermissions ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {connection.permissions.length} permissions granted
            </button>

            {showPermissions && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {connection.permissions.map((perm) => (
                  <span key={perm} className="px-2 py-0.5 text-[10px] bg-hover-bg text-text-secondary rounded font-mono">
                    {perm}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const { projectIntegrations } = useLocalStore();

  const connectionMap = new Map(
    projectIntegrations.map((c) => [c.provider, c])
  );

  const connectedCount = projectIntegrations.filter((i) => i.status === "connected").length;
  const availableCount = AVAILABLE_INTEGRATIONS.length - connectedCount;

  // Sort: connected first, then alphabetically
  const sortedIntegrations = [...AVAILABLE_INTEGRATIONS].sort((a, b) => {
    const aConnected = connectionMap.get(a.id)?.status === "connected";
    const bConnected = connectionMap.get(b.id)?.status === "connected";
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Integrations</h1>
            <p className="text-sm text-text-secondary mt-1">Connect external services to enhance your workflow</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-semibold text-text-primary">{connectedCount}</div>
                <div className="text-xs text-text-secondary">Connected</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-hover-bg flex items-center justify-center">
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-semibold text-text-primary">{availableCount}</div>
                <div className="text-xs text-text-secondary">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations list */}
        <div className="space-y-3">
          {sortedIntegrations.map((provider) => (
            <IntegrationCard
              key={provider.id}
              provider={provider}
              connection={connectionMap.get(provider.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
