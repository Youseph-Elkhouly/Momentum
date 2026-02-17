"use client";

import { useCallback } from "react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: "P0" | "P1" | "P2";
  owner?: string;
  due?: string;
  blocked?: boolean;
  blocker_reason?: string;
}

interface TaskCardProps {
  task: Task;
  currentColumn: string;
  isDoneColumn?: boolean;
  onMoveTo?: (columnId: string) => void;
  onSetBlocked?: (blocked: boolean, reason?: string) => void;
  onSendToOpenClaw?: (task: Task) => void;
}

function ownerInitials(owner: string): string {
  const parts = owner.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return owner.slice(0, 2).toUpperCase();
}

function PriorityBadge({ priority }: { priority: "P0" | "P1" | "P2" }) {
  const styles = {
    P0: "bg-priority-p0-bg text-priority-p0 border-priority-p0/20",
    P1: "bg-priority-p1-bg text-priority-p1 border-priority-p1/20",
    P2: "bg-priority-p2-bg text-priority-p2 border-priority-p2/20",
  };
  const labels = {
    P0: "Critical",
    P1: "High",
    P2: "Normal",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${styles[priority]}`}
      title={labels[priority]}
    >
      {priority}
    </span>
  );
}

export function TaskCard({ task, currentColumn, isDoneColumn, onMoveTo, onSetBlocked, onSendToOpenClaw }: TaskCardProps) {
  const otherColumns = ["todo", "doing", "done"].filter((c) => c !== currentColumn);

  const handleSendToOpenClaw = useCallback(() => {
    if (onSendToOpenClaw) {
      onSendToOpenClaw(task);
    }
  }, [task, onSendToOpenClaw]);

  return (
    <article
      className={`p-4 bg-white border border-border rounded-xl shadow-card hover:shadow-card-hover hover:border-text-secondary/20 transition-all duration-200 group ${
        isDoneColumn ? "opacity-70" : ""
      } ${task.blocked ? "border-l-4 border-l-priority-p0" : ""}`}
      data-task-id={task.id}
    >
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-medium text-text-primary leading-snug flex-1">
          {task.title}
        </h3>
        {task.priority && <PriorityBadge priority={task.priority} />}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Blocked warning */}
      {task.blocked && (
        <div className="flex items-center gap-2 mb-3 px-2.5 py-2 bg-priority-p0-bg rounded-lg border border-priority-p0/20">
          <svg className="w-4 h-4 text-priority-p0 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[11px] text-priority-p0 font-medium">
            {task.blocker_reason || "Blocked"}
          </span>
        </div>
      )}

      {/* Meta info */}
      {(task.owner || task.due) && (
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {task.owner && (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-[10px] font-semibold flex items-center justify-center">
                {ownerInitials(task.owner)}
              </span>
              <span className="truncate max-w-[80px]">{task.owner}</span>
            </div>
          )}
          {task.due && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{task.due}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions - visible on hover */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveTo && otherColumns.length > 0 && (
          <select
            className="text-[11px] text-text-secondary border border-border rounded-lg px-2 py-1.5 bg-white hover:bg-hover-bg focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) onMoveTo(v);
              e.target.value = "";
            }}
            aria-label="Move to column"
          >
            <option value="">Move to…</option>
            {otherColumns.map((c) => (
              <option key={c} value={c}>
                {c === "todo" ? "To Do" : c === "doing" ? "Doing" : "Done"}
              </option>
            ))}
          </select>
        )}
        {onSetBlocked && (
          <button
            type="button"
            onClick={() => onSetBlocked(!task.blocked)}
            className={`flex items-center gap-1 text-[11px] border rounded-lg px-2 py-1.5 transition-colors ${
              task.blocked
                ? "border-priority-p0/30 bg-priority-p0-bg text-priority-p0 hover:bg-priority-p0/10"
                : "border-border text-text-secondary hover:bg-hover-bg"
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {task.blocked ? "Unblock" : "Block"}
          </button>
        )}
        {onSendToOpenClaw && (
          <button
            type="button"
            onClick={handleSendToOpenClaw}
            className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 border border-accent/30 rounded-lg px-2 py-1.5 bg-accent-light hover:bg-accent/10 ml-auto transition-colors"
            title="Send to agent with context"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Send to Agent</span>
          </button>
        )}
      </div>
    </article>
  );
}
