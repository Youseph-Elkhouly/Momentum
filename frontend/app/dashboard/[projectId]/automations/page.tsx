"use client";

import { useState } from "react";
import { useLocalStore } from "@/lib/local-store";
import type { Automation, AutomationStatus, RunStatus } from "@/lib/types";

const triggerIcons: Record<string, string> = {
  schedule: "🕐",
  event: "⚡",
  manual: "👆",
};

const statusConfig: Record<AutomationStatus, { label: string; bg: string; text: string }> = {
  enabled: { label: "Enabled", bg: "bg-green-50", text: "text-green-700" },
  disabled: { label: "Disabled", bg: "bg-gray-100", text: "text-gray-500" },
  error: { label: "Error", bg: "bg-red-50", text: "text-red-700" },
};

const runStatusColors: Record<RunStatus, string> = {
  pending: "text-gray-500",
  running: "text-blue-600",
  success: "text-green-600",
  failed: "text-red-600",
  needs_approval: "text-amber-600",
  cancelled: "text-gray-400",
};

function formatTimeAgo(date: string | null): string {
  if (!date) return "Never";
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function formatNextRun(date: string | null): string {
  if (!date) return "—";
  const then = new Date(date);
  const now = new Date();
  const diff = then.getTime() - now.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (diff < 0) return "overdue";
  if (mins < 60) return `in ${mins}m`;
  if (hours < 24) return `in ${hours}h`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AutomationCard({ automation }: { automation: Automation }) {
  const { dispatch, createRun } = useLocalStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[automation.status];

  const handleToggle = () => {
    const newStatus: AutomationStatus = automation.status === "enabled" ? "disabled" : "enabled";
    dispatch({
      type: "UPDATE_AUTOMATION",
      payload: { ...automation, status: newStatus, updated_at: new Date().toISOString() },
    });
  };

  const handleDryRun = () => {
    createRun(`[DRY RUN] ${automation.name}`, `Dry run: ${automation.name}`);
  };

  const successPercent = Math.round(automation.success_rate * 100);

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Trigger icon */}
            <div className="w-10 h-10 rounded-lg bg-hover-bg flex items-center justify-center text-lg">
              {triggerIcons[automation.trigger_type]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-text-primary">{automation.name}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>
              {automation.description && (
                <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">{automation.description}</div>
              )}

              {/* Trigger info */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-text-secondary">
                <span className="capitalize">{automation.trigger_type}</span>
                {automation.trigger_config.schedule && (
                  <span className="font-mono bg-hover-bg px-1.5 py-0.5 rounded">
                    {automation.trigger_config.schedule}
                  </span>
                )}
                {automation.trigger_config.event && (
                  <span className="font-mono bg-hover-bg px-1.5 py-0.5 rounded">
                    on:{automation.trigger_config.event}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={handleToggle}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              automation.status === "enabled" ? "bg-accent" : "bg-gray-200"
            }`}
            aria-label={automation.status === "enabled" ? "Disable automation" : "Enable automation"}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                automation.status === "enabled" ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
          <div>
            <div className="text-[10px] uppercase text-text-secondary">Last run</div>
            <div className="text-xs text-text-primary mt-0.5 flex items-center gap-1">
              {automation.last_run_status && (
                <span className={runStatusColors[automation.last_run_status]}>●</span>
              )}
              {formatTimeAgo(automation.last_run_at)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-text-secondary">Next run</div>
            <div className="text-xs text-text-primary mt-0.5">{formatNextRun(automation.next_run_at)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-text-secondary">Success rate</div>
            <div className="text-xs text-text-primary mt-0.5 flex items-center gap-2">
              <div className="w-16 h-1.5 bg-hover-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${successPercent >= 80 ? "bg-green-500" : successPercent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${successPercent}%` }}
                />
              </div>
              <span>{successPercent}%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-text-secondary">Total runs</div>
            <div className="text-xs text-text-primary mt-0.5">{automation.total_runs}</div>
          </div>
        </div>

        {/* Required integrations */}
        {automation.required_integrations.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-text-secondary">Requires:</span>
            {automation.required_integrations.map((int) => (
              <span key={int} className="px-1.5 py-0.5 text-[10px] bg-hover-bg text-text-secondary rounded capitalize">
                {int}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 bg-background border-t border-border flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {automation.steps.length} steps
        </button>
        <button
          onClick={handleDryRun}
          className="px-3 py-1.5 text-xs font-medium text-text-primary bg-white border border-border rounded-lg hover:bg-hover-bg transition-colors"
        >
          Dry Run
        </button>
      </div>

      {/* Expanded steps */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-border bg-background">
          <div className="space-y-2">
            {automation.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-[10px] text-text-secondary">
                  {i + 1}
                </div>
                <div className="flex-1 text-xs text-text-primary">{step.name}</div>
                <div className="text-[10px] text-text-secondary font-mono">
                  {step.tool}.{step.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationsPage() {
  const { projectAutomations } = useLocalStore();
  const [filter, setFilter] = useState<"all" | AutomationStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredAutomations = projectAutomations.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const counts = {
    all: projectAutomations.length,
    enabled: projectAutomations.filter((a) => a.status === "enabled").length,
    disabled: projectAutomations.filter((a) => a.status === "disabled").length,
    error: projectAutomations.filter((a) => a.status === "error").length,
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Automations</h1>
            <p className="text-sm text-text-secondary mt-1">Scheduled and event-driven agent workflows</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-white rounded-lg text-sm font-medium hover:bg-text-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Automation
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(["all", "enabled", "disabled", "error"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === key
                  ? "bg-text-primary text-white"
                  : "bg-hover-bg text-text-secondary hover:text-text-primary"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
              <span className={`ml-1.5 ${filter === key ? "text-white/70" : "text-text-secondary/70"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Automations list */}
        {filteredAutomations.length > 0 ? (
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-hover-bg flex items-center justify-center">
              <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-text-primary mb-1">No automations found</div>
            <div className="text-xs text-text-secondary">
              {filter !== "all" ? "Try a different filter" : "Create your first automation to get started"}
            </div>
          </div>
        )}

        {/* Create Modal (placeholder) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white border border-border rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Create Automation</h2>
              <p className="text-sm text-text-secondary mb-6">
                Automation creation is coming soon. For now, you can use slash commands to trigger agent workflows.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
