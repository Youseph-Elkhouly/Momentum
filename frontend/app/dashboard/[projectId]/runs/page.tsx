"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalStore } from "@/lib/local-store";
import type { Run, RunStep, RunStatus } from "@/lib/types";
import { ApprovalQueue } from "@/components/agentic/ApprovalQueue";

type FilterType = "all" | "running" | "needs_approval" | "failed" | "success";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "needs_approval", label: "Needs Approval" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
];

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTimeAgo(date: string): string {
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

function StepRow({ step, isLast }: { step: RunStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    pending: { icon: "○", color: "text-text-secondary", bg: "bg-gray-100" },
    running: { icon: "◉", color: "text-accent", bg: "bg-accent-light" },
    success: { icon: "✓", color: "text-green-600", bg: "bg-green-50" },
    failed: { icon: "✕", color: "text-red-600", bg: "bg-red-50" },
    needs_approval: { icon: "!", color: "text-amber-600", bg: "bg-amber-50" },
    skipped: { icon: "—", color: "text-text-secondary", bg: "bg-gray-100" },
  };

  const config = statusConfig[step.status];

  const toolLabels = {
    backboard: "Backboard",
    openclaw: "OpenClaw",
    internal: "Internal",
  };

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover-bg transition-colors text-left"
      >
        {/* Timeline indicator */}
        <div className="flex flex-col items-center">
          <div className={`w-6 h-6 rounded-full ${config.bg} ${config.color} flex items-center justify-center text-xs font-mono`}>
            {step.status === "running" ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              config.icon
            )}
          </div>
          {!isLast && <div className="w-px h-full bg-border mt-1" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{step.name}</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-hover-bg text-text-secondary rounded">
              {toolLabels[step.tool]}
            </span>
          </div>
          <div className="text-xs text-text-secondary mt-0.5">{step.tool_action}</div>
        </div>

        {/* Duration */}
        <div className="text-xs text-text-secondary font-mono">{formatDuration(step.duration_ms)}</div>

        {/* Expand icon */}
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-16">
          <div className="bg-background rounded-lg border border-border p-3 space-y-3">
            {step.input && Object.keys(step.input).length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-text-secondary mb-1">Input</div>
                <pre className="text-xs text-text-primary font-mono bg-white p-2 rounded border border-border overflow-x-auto">
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}
            {step.output && Object.keys(step.output).length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-text-secondary mb-1">Output</div>
                <pre className="text-xs text-text-primary font-mono bg-white p-2 rounded border border-border overflow-x-auto">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}
            {step.error && (
              <div>
                <div className="text-[10px] uppercase text-red-600 mb-1">Error</div>
                <pre className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                  {step.error}
                </pre>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button className="px-2 py-1 text-[10px] text-text-secondary border border-border rounded hover:bg-hover-bg transition-colors">
                Copy
              </button>
              <button className="px-2 py-1 text-[10px] text-text-secondary border border-border rounded hover:bg-hover-bg transition-colors">
                Re-run step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RunDetail({ run }: { run: Run }) {
  const statusColors: Record<RunStatus, string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-50 text-blue-700",
    success: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    needs_approval: "bg-amber-50 text-amber-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">{run.name}</div>
            <div className="text-xs text-text-secondary mt-0.5">
              {formatTimeAgo(run.created_at)} • {run.command}
            </div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[run.status]}`}>
            {run.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="divide-y divide-border">
        {run.steps.map((step, i) => (
          <StepRow key={step.id} step={step} isLast={i === run.steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function RunsPage() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterType) || "all";
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const { projectRuns, pendingApprovals, dispatch } = useLocalStore();

  const filteredRuns = projectRuns.filter((run) => {
    if (filter === "all") return true;
    return run.status === filter;
  });

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Runs</h1>
            <p className="text-sm text-text-secondary mt-1">View and manage agent execution history</p>
          </div>
          <button
            onClick={() => dispatch({ type: "TOGGLE_COMMAND_BAR", payload: true })}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-white rounded-lg text-sm font-medium hover:bg-text-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Run
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {FILTERS.map((f) => {
                const count =
                  f.key === "all" ? projectRuns.length : projectRuns.filter((r) => r.status === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      filter === f.key
                        ? "bg-text-primary text-white"
                        : "bg-hover-bg text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={`ml-1.5 ${filter === f.key ? "text-white/80" : "text-text-secondary/70"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Runs list */}
            {filteredRuns.length > 0 ? (
              <div className="space-y-4">
                {filteredRuns.map((run) => (
                  <RunDetail key={run.id} run={run} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <div className="text-sm text-text-secondary">No runs found</div>
              </div>
            )}
          </div>

          {/* Sidebar: Approval Queue */}
          <div>
            <h2 className="text-sm font-medium text-text-primary mb-4">
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </h2>
            <ApprovalQueue approvals={pendingApprovals} />
          </div>
        </div>
      </div>
    </div>
  );
}
