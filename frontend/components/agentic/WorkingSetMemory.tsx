"use client";

import type { MemoryItem, MemoryCategory } from "@/lib/types";
import { useLocalStore } from "@/lib/local-store";

const categoryConfig: Record<MemoryCategory, { icon: string; color: string }> = {
  fact: { icon: "📝", color: "bg-blue-50 text-blue-700" },
  decision: { icon: "⚖️", color: "bg-purple-50 text-purple-700" },
  preference: { icon: "⭐", color: "bg-green-50 text-green-700" },
  risk: { icon: "⚠️", color: "bg-red-50 text-red-700" },
  link: { icon: "🔗", color: "bg-cyan-50 text-cyan-700" },
  note: { icon: "📌", color: "bg-amber-50 text-amber-700" },
};

function MemoryCard({ item }: { item: MemoryItem }) {
  const { dispatch } = useLocalStore();
  const config = categoryConfig[item.category];

  const handleRemoveFromWorkingSet = () => {
    dispatch({
      type: "UPDATE_MEMORY",
      payload: { ...item, in_working_set: false, updated_at: new Date().toISOString() },
    });
  };

  return (
    <div className="bg-white border border-border rounded-lg p-3 group">
      <div className="flex items-start gap-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center text-sm ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-primary line-clamp-2">{item.content}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-1.5 py-0.5 text-[10px] rounded ${config.color}`}>{item.category}</span>
            {item.pinned && (
              <span className="text-[10px] text-accent">📌 Pinned</span>
            )}
          </div>
        </div>
        <button
          onClick={handleRemoveFromWorkingSet}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 transition-all"
          title="Remove from working set"
          aria-label="Remove from working set"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function WorkingSetMemory({ items }: { items: MemoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center">
        <div className="text-xs text-text-secondary">
          No items in working set.
          <br />
          <span className="text-text-secondary/70">Add items from Memory to keep them active.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <MemoryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
