"use client";

import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import { useStore } from "@/lib/store";

export default function ApprovalsPage() {
  const { pendingApprovalCount } = useStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">
          Approval Queue
          {pendingApprovalCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-sm bg-amber-500/20 text-amber-500 rounded-full">
              {pendingApprovalCount}
            </span>
          )}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review and approve agent actions before they&apos;re executed
        </p>
      </div>

      {/* Approval Queue */}
      <ApprovalQueue />
    </div>
  );
}
