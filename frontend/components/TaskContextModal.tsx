"use client";

import { useState, useEffect } from "react";
import type { Task } from "./TaskCard";
import type { MemoryItem } from "./MemoryPanel";

interface TaskContextModalProps {
  isOpen: boolean;
  task: Task | null;
  memory: {
    decisions: MemoryItem[];
    preferences: MemoryItem[];
    risks: MemoryItem[];
    summary: MemoryItem[];
  };
  onClose: () => void;
  onConfirm: (task: Task, selectedMemory: MemoryItem[]) => void;
}

const MEMORY_SECTIONS = [
  { key: "decisions", label: "Decisions", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "text-status-done" },
  { key: "preferences", label: "Preferences", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", color: "text-status-doing" },
  { key: "risks", label: "Risks", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-priority-p0" },
  { key: "summary", label: "Summary", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-accent" },
] as const;

export function TaskContextModal({
  isOpen,
  task,
  memory,
  onClose,
  onConfirm,
}: TaskContextModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Reset selection when modal opens with a new task
  useEffect(() => {
    if (isOpen && task) {
      // Pre-select pinned items
      const pinned = new Set<string>();
      Object.values(memory).flat().forEach((item) => {
        if (item.pinned) pinned.add(item.id);
      });
      setSelectedIds(pinned);
    }
  }, [isOpen, task, memory]);

  if (!isOpen || !task) return null;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    Object.values(memory).flat().forEach((item) => all.add(item.id));
    setSelectedIds(all);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const selectedMemory = Object.values(memory)
        .flat()
        .filter((item) => selectedIds.has(item.id));
      await onConfirm(task, selectedMemory);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(memory).flat().length;
  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Select Context for Agent
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Choose which project memory to include when sending this task to the agent.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-hover-bg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Task Preview */}
        <div className="px-5 py-3 bg-background-alt/50 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Task
          </div>
          <p className="text-sm font-medium text-text-primary">{task.title}</p>
          {task.description && (
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Selection Controls */}
        <div className="px-5 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {selectedCount} of {totalItems} items selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-accent hover:text-accent/80 font-medium"
            >
              Select all
            </button>
            <span className="text-text-secondary">·</span>
            <button
              onClick={selectNone}
              className="text-xs text-text-secondary hover:text-text-primary font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Memory Sections */}
        <div className="px-5 py-4 max-h-[300px] overflow-y-auto space-y-4">
          {MEMORY_SECTIONS.map((section) => {
            const items = memory[section.key as keyof typeof memory];
            if (items.length === 0) return null;

            return (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-4 h-4 ${section.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                    {section.label}
                  </h3>
                  <span className="text-[10px] text-text-secondary">
                    ({items.filter((i) => selectedIds.has(i.id)).length}/{items.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        selectedIds.has(item.id)
                          ? "border-accent/30 bg-accent-light/50"
                          : "border-border hover:border-text-secondary/30 hover:bg-hover-bg/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary leading-snug">{item.content}</p>
                        {item.pinned && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-accent font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Pinned
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {totalItems === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-text-secondary">No memory items available.</p>
              <p className="text-xs text-text-secondary/70 mt-1">
                Generate a plan from your notes to create context.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-background-alt/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Preparing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Send to Agent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
