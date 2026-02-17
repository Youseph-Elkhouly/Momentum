"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ApprovalItem } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/utils";

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    await onApprove();
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    await onReject();
    setIsLoading(false);
  };

  const typeIcons: Record<ApprovalItem["type"], React.ReactNode> = {
    task_create: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    task_update: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    memory_update: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    integration_action: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    ),
    other: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="bg-surface border border-amber-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              {typeIcons[approval.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">
                {approval.title}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {approval.type.replace("_", " ")} • {formatDistanceToNow(approval.created_at)}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-text-secondary mt-2">
          {approval.description}
        </p>
      </div>

      {/* Expanded details */}
      {isExpanded && approval.diff && (
        <div className="px-4 pb-4">
          <div className="bg-background rounded-lg p-3 border border-border">
            <pre className="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap">
              {approval.diff.after}
            </pre>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-background/50 border-t border-border flex items-center justify-between">
        <div className="text-xs text-text-muted">
          Run: {approval.run_id.slice(0, 8)}...
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApprovalQueue() {
  const { state, dispatch, approvalsList } = useStore();
  const pendingApprovals = approvalsList; // Already filtered to pending in the store

  const handleApproval = async (approvalId: string, action: "approve" | "reject") => {
    const approval = approvalsList.find((a) => a.id === approvalId);
    if (!approval || !state.currentProject) return;

    try {
      const res = await fetch(
        `/api/projects/${state.currentProject.id}/approvals/${approvalId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();

      if (data.approval) {
        dispatch({ type: "UPDATE_APPROVAL", payload: data.approval });
      }
      if (data.run) {
        dispatch({ type: "UPDATE_RUN", payload: data.run });
      }
      if (data.task) {
        dispatch({ type: "ADD_TASK", payload: data.task });
      }
    } catch (error) {
      console.error("Failed to process approval:", error);
    }
  };

  if (pendingApprovals.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-sm font-medium text-text-primary mb-0.5">All caught up</div>
        <div className="text-xs text-text-muted">No pending approvals</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingApprovals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          onApprove={() => handleApproval(approval.id, "approve")}
          onReject={() => handleApproval(approval.id, "reject")}
        />
      ))}
    </div>
  );
}
