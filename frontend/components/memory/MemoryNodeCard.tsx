"use client";

import { memo, useCallback } from "react";
import type { MemoryNode, MemoryNodeType } from "@/lib/types";

const typeConfig: Record<MemoryNodeType, { icon: string; borderColor: string; bgColor: string }> = {
  fact: { icon: "📝", borderColor: "border-blue-300", bgColor: "bg-blue-50" },
  decision: { icon: "⚖️", borderColor: "border-purple-300", bgColor: "bg-purple-50" },
  preference: { icon: "⭐", borderColor: "border-green-300", bgColor: "bg-green-50" },
  risk: { icon: "⚠️", borderColor: "border-red-300", bgColor: "bg-red-50" },
  note: { icon: "📌", borderColor: "border-amber-300", bgColor: "bg-amber-50" },
  link: { icon: "🔗", borderColor: "border-cyan-300", bgColor: "bg-cyan-50" },
  file: { icon: "📎", borderColor: "border-gray-300", bgColor: "bg-gray-50" },
};

interface MemoryNodeCardProps {
  node: MemoryNode;
  isSelected: boolean;
  isLinkSource: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onMouseDownForDrag: (e: React.MouseEvent) => void;
  onPositionChange: (x: number, y: number) => void;
  childCount?: number;
}

function MemoryNodeCardComponent({
  node,
  isSelected,
  isLinkSource,
  onSelect,
  onDragStart,
  onMouseDownForDrag,
  childCount = 0,
}: MemoryNodeCardProps) {
  const config = typeConfig[node.type];

  // HTML5 drag for attaching to tasks (only from the drag handle)
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-momentum-node", node.id);
    e.dataTransfer.effectAllowed = "copyMove";
    onDragStart(e);
  };

  // Mouse down for repositioning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onMouseDownForDrag(e);
  }, [onMouseDownForDrag]);

  const selectedClass = isSelected ? "ring-2 ring-gray-900 ring-offset-2 shadow-lg scale-[1.02]" : "hover:shadow-md hover:scale-[1.01]";
  const linkSourceClass = isLinkSource ? "ring-2 ring-blue-500 ring-offset-2" : "";
  const pinnedClass = node.pinned ? "border-solid" : "border-dashed";

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute w-[200px] p-3 rounded-xl border-2 bg-white shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${config.borderColor} ${selectedClass} ${linkSourceClass} ${pinnedClass}`}
      style={{
        left: node.x,
        top: node.y,
      }}
      tabIndex={0}
      role="button"
      aria-label={`Memory node: ${node.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-lg ${config.bgColor} flex items-center justify-center text-sm`}>
          {config.icon}
        </span>
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          {node.type}
        </span>
        {/* Drag handle for attaching to tasks */}
        <div
          draggable
          data-drag-handle
          onDragStart={handleDragStart}
          className="ml-auto p-1 text-gray-300 hover:text-gray-500 cursor-move rounded hover:bg-gray-100 transition-colors"
          title="Drag to attach to a task"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        </div>
        {node.pinned && (
          <span className="text-gray-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
        {node.title}
      </h3>

      {/* Content preview */}
      {node.content && (
        <p className="text-xs text-gray-500 line-clamp-2">
          {node.content}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {node.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded truncate">
                {tag}
              </span>
            ))}
            {node.tags.length > 2 && (
              <span className="text-[9px] text-gray-400">+{node.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Child count indicator */}
        {childCount > 0 && (
          <div className="flex items-center gap-1 text-purple-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[9px]">{childCount}</span>
          </div>
        )}

        {/* File indicator */}
        {node.files.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-[9px]">{node.files.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const MemoryNodeCard = memo(MemoryNodeCardComponent);
