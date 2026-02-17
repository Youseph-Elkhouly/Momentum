"use client";

import { useStore } from "@/lib/store";
import { Run, RunStep, RunStepStatus } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/utils";

function StepIcon({ tool, status }: { tool: RunStep["tool"]; status: RunStepStatus }) {
  const baseClasses = "w-6 h-6 rounded-full flex items-center justify-center text-xs";

  if (status === "running") {
    return (
      <div className={`${baseClasses} bg-accent/20 text-accent`}>
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={`${baseClasses} bg-red-500/20 text-red-500`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={`${baseClasses} bg-green-500/20 text-green-500`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  // Pending, needs_approval, or skipped
  const iconByTool: Record<RunStep["tool"], React.ReactNode> = {
    backboard: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    openclaw: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    internal: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      </svg>
    ),
  };

  return (
    <div className={`${baseClasses} bg-surface-hover text-text-muted`}>
      {iconByTool[tool]}
    </div>
  );
}

function RunCard({ run }: { run: Run }) {
  const statusColors: Record<Run["status"], string> = {
    pending: "bg-gray-500/20 text-gray-400",
    running: "bg-accent/20 text-accent",
    success: "bg-green-500/20 text-green-500",
    failed: "bg-red-500/20 text-red-500",
    needs_approval: "bg-amber-500/20 text-amber-500",
    cancelled: "bg-gray-500/20 text-gray-400",
  };

  const latestSteps = run.steps.slice(-3);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-accent/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {run.command}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {formatDistanceToNow(run.created_at)}
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[run.status]}`}>
          {run.status.replace("_", " ")}
        </span>
      </div>

      {/* Steps timeline */}
      {latestSteps.length > 0 && (
        <div className="space-y-2">
          {latestSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <StepIcon tool={step.tool} status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-secondary truncate">
                  {step.name}
                </div>
              </div>
              {index === latestSteps.length - 1 && step.status === "running" && (
                <div className="text-xs text-accent">Live</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Description (if present) */}
      {run.status === "success" && run.description && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-text-secondary line-clamp-2">
            {run.description}
          </div>
        </div>
      )}
    </div>
  );
}

export function RunFeed() {
  const { runsList } = useStore();
  const runs = runsList.slice(0, 10); // Show latest 10

  if (runs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-hover flex items-center justify-center">
          <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-text-primary mb-1">No runs yet</div>
        <div className="text-xs text-text-muted">
          Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">⌘K</kbd> to start your first run
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
