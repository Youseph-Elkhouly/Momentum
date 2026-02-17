"use client";

import { useLocalStore } from "@/lib/local-store";
import Link from "next/link";

export function TopBar() {
  const { state, dispatch, currentProject, runningRuns, pendingApprovals } = useLocalStore();

  // Determine agent status
  const agentState = state.agentStatus.state;
  const statusConfig = {
    ready: { label: "Ready", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    running: { label: "Running", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500 animate-pulse" },
    needs_approval: { label: "Needs Approval", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    error: { label: "Error", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };
  const status = statusConfig[agentState];

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-4">
      {/* Left: Breadcrumb / Project info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-text-secondary">Dashboard</span>
        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-sm font-medium text-text-primary truncate">{currentProject?.name || "Project"}</span>
      </div>

      {/* Center: Command Bar trigger */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMMAND_BAR", payload: true })}
          className="flex items-center gap-2 px-4 py-2 w-full max-w-md bg-background border border-border rounded-lg text-sm text-text-secondary hover:border-text-secondary/50 hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Open command bar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="flex-1 text-left">Ask Momentum anything...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white border border-border rounded text-text-secondary">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-3">
        {/* Agent status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg}`}>
          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
        </div>

        {/* Running count */}
        {runningRuns.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-light rounded-full">
            <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium text-accent">{runningRuns.length} running</span>
          </div>
        )}

        {/* Pending approvals */}
        {pendingApprovals.length > 0 && (
          <Link
            href={`/dashboard/${currentProject?.id}/runs?filter=needs_approval`}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors"
          >
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-medium text-amber-700">{pendingApprovals.length}</span>
          </Link>
        )}

        {/* New Run button */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMMAND_BAR", payload: true })}
          className="flex items-center gap-2 px-3 py-1.5 bg-text-primary text-white rounded-lg text-sm font-medium hover:bg-text-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Run</span>
        </button>
      </div>
    </header>
  );
}
