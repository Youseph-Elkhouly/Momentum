"use client";

import { useState } from "react";
import { useLocalStore } from "@/lib/local-store";
import type { ApprovalItem } from "@/lib/types";

function ApprovalCard({ approval }: { approval: ApprovalItem }) {
  const { approveItem, rejectItem } = useLocalStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    approveItem(approval.id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    rejectItem(approval.id);
    setIsProcessing(false);
  };

  const typeIcons: Record<ApprovalItem["type"], string> = {
    task_create: "➕",
    task_update: "✏️",
    memory_update: "🧠",
    integration_action: "🔗",
    other: "❓",
  };

  return (
    <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base">
            {typeIcons[approval.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary">{approval.title}</div>
            <div className="text-xs text-text-secondary mt-0.5">{approval.type.replace("_", " ")}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-text-secondary mt-2 line-clamp-2">{approval.description}</p>
      </div>

      {/* Expanded diff view */}
      {isExpanded && approval.diff && (
        <div className="px-4 pb-3">
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="text-[10px] uppercase text-text-secondary mb-2">Changes</div>
            <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono">{approval.diff.after}</pre>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 bg-background border-t border-border flex items-center justify-end gap-2">
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Approve"}
        </button>
      </div>
    </div>
  );
}

export function ApprovalQueue({ approvals }: { approvals: ApprovalItem[] }) {
  if (approvals.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="text-sm font-medium text-text-primary mb-0.5">All caught up</div>
        <div className="text-xs text-text-secondary">No pending approvals</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval) => (
        <ApprovalCard key={approval.id} approval={approval} />
      ))}
    </div>
  );
}
