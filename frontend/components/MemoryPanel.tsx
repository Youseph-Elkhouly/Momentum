"use client";

import { useState } from "react";

export interface MemoryItem {
  id: string;
  content: string;
  created_at: string;
  pinned: boolean;
}

interface MemoryPanelProps {
  decisions: MemoryItem[];
  preferences: MemoryItem[];
  risks: MemoryItem[];
  summary: MemoryItem[];
  onPin?: (id: string, pinned: boolean) => void;
  onCorrect?: (id: string, content: string) => void;
}

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const SECTION_CONFIG = {
  decisions: {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "text-status-done",
    bgColor: "bg-status-done/10",
  },
  preferences: {
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    color: "text-status-doing",
    bgColor: "bg-status-doing/10",
  },
  risks: {
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    color: "text-priority-p0",
    bgColor: "bg-priority-p0/10",
  },
  summary: {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
};

function MemorySection({
  title,
  items,
  config,
  onPin,
  onCorrect,
}: {
  title: string;
  items: MemoryItem[];
  config: typeof SECTION_CONFIG.decisions;
  onPin?: (id: string, pinned: boolean) => void;
  onCorrect?: (id: string, content: string) => void;
}) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md ${config.bgColor} flex items-center justify-center`}>
          <svg className={`w-3.5 h-3.5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
          </svg>
        </div>
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-[10px] text-text-secondary bg-background-alt px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-2 pl-8">
        {items.length === 0 ? (
          <p className="text-xs text-text-secondary/70 italic py-2">No {title.toLowerCase()} yet</p>
        ) : (
          items.map((item) => (
            <MemoryItemRow
              key={item.id}
              item={item}
              onPin={onPin}
              onCorrect={onCorrect}
            />
          ))
        )}
      </div>
    </section>
  );
}

function MemoryItemRow({
  item,
  onPin,
  onCorrect,
}: {
  item: MemoryItem;
  onPin?: (id: string, pinned: boolean) => void;
  onCorrect?: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.content);

  const handleSave = () => {
    if (editValue.trim() !== item.content && onCorrect) {
      onCorrect(item.id, editValue.trim());
    }
    setEditing(false);
  };

  return (
    <div className="group p-2.5 rounded-lg bg-white border border-border/50 hover:border-border transition-colors">
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="text-xs text-accent hover:text-accent/80 font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditValue(item.content);
                setEditing(false);
              }}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-primary leading-relaxed">{item.content}</p>
          <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {relativeTime(item.created_at)}
            </span>
            {onPin && (
              <button
                type="button"
                onClick={() => onPin(item.id, !item.pinned)}
                className={`text-[10px] font-medium flex items-center gap-1 transition-colors ${
                  item.pinned ? "text-accent" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <svg className="w-3 h-3" fill={item.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {item.pinned ? "Pinned" : "Pin"}
              </button>
            )}
            {onCorrect && item.pinned && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[10px] font-medium text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function MemoryPanel({
  decisions,
  preferences,
  risks,
  summary,
  onPin,
  onCorrect,
}: MemoryPanelProps) {
  return (
    <aside className="h-full overflow-y-auto" aria-label="Project memory">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Project Memory</h2>
      </div>
      <MemorySection title="Decisions" items={decisions} config={SECTION_CONFIG.decisions} onPin={onPin} onCorrect={onCorrect} />
      <MemorySection title="Preferences" items={preferences} config={SECTION_CONFIG.preferences} onPin={onPin} onCorrect={onCorrect} />
      <MemorySection title="Risks" items={risks} config={SECTION_CONFIG.risks} onPin={onPin} onCorrect={onCorrect} />
      <MemorySection title="Summary" items={summary} config={SECTION_CONFIG.summary} onPin={onPin} onCorrect={onCorrect} />
    </aside>
  );
}
