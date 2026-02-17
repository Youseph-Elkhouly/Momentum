"use client";

import type { Run, RunStep } from "@/lib/types";

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
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function StepStatusIcon({ status }: { status: RunStep["status"] }) {
  const config = {
    pending: { icon: "○", color: "text-text-secondary" },
    running: { icon: "◉", color: "text-accent animate-pulse" },
    success: { icon: "✓", color: "text-green-600" },
    failed: { icon: "✕", color: "text-red-600" },
    needs_approval: { icon: "!", color: "text-amber-600" },
    skipped: { icon: "—", color: "text-text-secondary" },
  };
  const { icon, color } = config[status];
  return <span className={`text-sm font-mono ${color}`}>{icon}</span>;
}

function RunCard({ run }: { run: Run }) {
  const statusColors: Record<Run["status"], string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-50 text-blue-700",
    success: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    needs_approval: "bg-amber-50 text-amber-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const totalDuration = run.steps.reduce((acc, s) => acc + (s.duration_ms || 0), 0);

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden hover:border-text-secondary/30 transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">{run.name}</div>
            <div className="text-xs text-text-secondary mt-0.5">{formatTimeAgo(run.created_at)}</div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[run.status]}`}>
            {run.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 py-2 space-y-1">
        {run.steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-xs">
            <StepStatusIcon status={step.status} />
            <span className="flex-1 text-text-secondary truncate">{step.name}</span>
            <span className="text-text-secondary/70 font-mono text-[10px]">{formatDuration(step.duration_ms)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {run.status === "success" && (
        <div className="px-4 py-2 bg-background border-t border-border">
          <div className="text-[10px] text-text-secondary">
            Completed in {formatDuration(totalDuration)}
          </div>
        </div>
      )}
    </div>
  );
}

export function RunFeed({ runs }: { runs: Run[] }) {
  if (runs.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-hover-bg flex items-center justify-center">
          <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-text-primary mb-1">No runs yet</div>
        <div className="text-xs text-text-secondary">
          Press <kbd className="px-1.5 py-0.5 bg-hover-bg border border-border rounded text-[10px]">⌘K</kbd> to start your first run
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </div>
  );
}
