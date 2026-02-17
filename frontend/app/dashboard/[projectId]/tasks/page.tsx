"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { TaskStatus, TaskPriority, TaskWithMemory, MemoryNode } from "@/lib/types";
import { getTasks, saveTasks, attachMemoryToTask, detachMemoryFromTask, getGraph } from "@/lib/storage/graphStore";

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "border-blue-400" },
  { key: "doing", label: "In Progress", color: "border-amber-400" },
  { key: "done", label: "Done", color: "border-green-400" },
];

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  P0: { label: "P0", bg: "bg-red-100", text: "text-red-700" },
  P1: { label: "P1", bg: "bg-orange-100", text: "text-orange-700" },
  P2: { label: "P2", bg: "bg-yellow-100", text: "text-yellow-700" },
  P3: { label: "P3", bg: "bg-gray-100", text: "text-gray-600" },
};

const nodeTypeIcons: Record<string, string> = {
  fact: "📝",
  decision: "⚖️",
  preference: "⭐",
  risk: "⚠️",
  note: "📌",
  link: "🔗",
  file: "📎",
};

function MemoryChip({ node, onRemove }: { node: MemoryNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded-full">
      <span>{nodeTypeIcons[node.type] || "📝"}</span>
      <span className="max-w-[80px] truncate">{node.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 hover:text-red-500 transition-colors"
        aria-label={`Remove ${node.title}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

function TaskCard({
  task,
  nodes,
  onDragStart,
  onMemoryDrop,
  onMemoryRemove,
  isDropTarget,
  onSetDropTarget,
}: {
  task: TaskWithMemory;
  nodes: MemoryNode[];
  onDragStart: (e: React.DragEvent, task: TaskWithMemory) => void;
  onMemoryDrop: (taskId: string, nodeId: string) => void;
  onMemoryRemove: (taskId: string, nodeId: string) => void;
  isDropTarget: boolean;
  onSetDropTarget: (taskId: string | null) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const priority = task.priority ? priorityConfig[task.priority] : null;

  // Get attached memory nodes
  const attachedNodes = task.memoryRefs
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is MemoryNode => n !== undefined);

  const handleDragOver = (e: React.DragEvent) => {
    const nodeId = e.dataTransfer.types.includes("application/x-momentum-node");
    if (nodeId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      onSetDropTarget(task.id);
    }
  };

  const handleDragLeave = () => {
    onSetDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData("application/x-momentum-node");
    if (nodeId) {
      onMemoryDrop(task.id, nodeId);
    }
    onSetDropTarget(null);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all group ${
        isDropTarget
          ? "border-purple-400 ring-2 ring-purple-200 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Drop zone indicator */}
      {isDropTarget && (
        <div className="absolute inset-0 bg-purple-50/50 rounded-lg flex items-center justify-center pointer-events-none z-10">
          <span className="text-xs text-purple-600 font-medium">Drop to attach</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {priority && (
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          )}
          {task.stage !== "completed" && task.stage !== "approved" && (
            <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded capitalize">
              {task.stage}
            </span>
          )}
          {task.owner_type === "agent" && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded">Agent</span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Task actions"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>⚡</span> Ask agent to do this
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>📊</span> Break into subtasks
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>✅</span> Generate criteria
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-gray-900 mb-1">{task.title}</div>

      {/* Description */}
      {task.description && (
        <div className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</div>
      )}

      {/* Attached Memory */}
      {attachedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {attachedNodes.map((node) => (
            <MemoryChip
              key={node.id}
              node={node}
              onRemove={() => onMemoryRemove(task.id, node.id)}
            />
          ))}
        </div>
      )}

      {/* Acceptance criteria */}
      {task.acceptance_criteria.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-gray-500">
            {task.acceptance_criteria.length} criteria
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        {task.owner ? (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                task.owner_type === "agent" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              }`}
            >
              {task.owner.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] text-gray-500">{task.owner}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">Unassigned</span>
        )}

        {task.due && (
          <span className="text-[10px] text-gray-500">
            Due {new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Blocked indicator */}
      {task.blocked && (
        <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-[10px] text-red-700">
          ⚠️ {task.blocker_reason || "Blocked"}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  nodes,
  onDragStart,
  onDragOver,
  onDrop,
  onMemoryDrop,
  onMemoryRemove,
  dropTargetId,
  onSetDropTarget,
}: {
  column: (typeof COLUMNS)[0];
  tasks: TaskWithMemory[];
  nodes: MemoryNode[];
  onDragStart: (e: React.DragEvent, task: TaskWithMemory) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onMemoryDrop: (taskId: string, nodeId: string) => void;
  onMemoryRemove: (taskId: string, nodeId: string) => void;
  dropTargetId: string | null;
  onSetDropTarget: (taskId: string | null) => void;
}) {
  return (
    <div className="flex-1 min-w-[300px] flex flex-col">
      {/* Column header */}
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${column.color}`}>
        <span className="text-sm font-medium text-gray-900">{column.label}</span>
        <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded-full">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div
        className="flex-1 space-y-2 min-h-[200px] p-2 bg-gray-50 rounded-lg"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.key)}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              nodes={nodes}
              onDragStart={onDragStart}
              onMemoryDrop={onMemoryDrop}
              onMemoryRemove={onMemoryRemove}
              isDropTarget={dropTargetId === task.id}
              onSetDropTarget={onSetDropTarget}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-xs text-gray-400">No tasks</div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [tasks, setTasks] = useState<TaskWithMemory[]>([]);
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [draggedTask, setDraggedTask] = useState<TaskWithMemory | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority | "">("");
  const [toast, setToast] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    setTasks(getTasks(projectId));
    const graph = getGraph(projectId);
    setNodes(graph.nodes);
  }, [projectId]);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const handleDragStart = (e: React.DragEvent, task: TaskWithMemory) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-momentum-task", task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      const updatedTasks = tasks.map((t) =>
        t.id === draggedTask.id
          ? {
              ...t,
              status: newStatus,
              stage: newStatus === "done" ? "completed" : newStatus === "doing" ? "executing" : t.stage,
              updated_at: new Date().toISOString(),
            }
          : t
      );
      setTasks(updatedTasks as TaskWithMemory[]);
      saveTasks(projectId, updatedTasks as TaskWithMemory[]);
    }
    setDraggedTask(null);
  };

  const handleMemoryDrop = (taskId: string, nodeId: string) => {
    const success = attachMemoryToTask(projectId, taskId, nodeId);
    if (success) {
      setTasks(getTasks(projectId));
      const node = nodes.find((n) => n.id === nodeId);
      showToast(`Attached "${node?.title || "memory"}" to task`);
    } else {
      showToast("Already attached");
    }
  };

  const handleMemoryRemove = (taskId: string, nodeId: string) => {
    detachMemoryFromTask(projectId, taskId, nodeId);
    setTasks(getTasks(projectId));
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const now = new Date().toISOString();
    const newTask: TaskWithMemory = {
      id: "task_" + Date.now(),
      project_id: projectId,
      title: newTaskTitle.trim(),
      description: null,
      priority: newTaskPriority || null,
      owner: null,
      owner_type: "human",
      due: null,
      status: "todo",
      stage: "proposed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: [],
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(projectId, updatedTasks);
    setNewTaskTitle("");
    setNewTaskPriority("");
    setShowNewTaskModal(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag memory nodes from the Memory page onto tasks to attach context
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.key}
            column={column}
            tasks={tasksByStatus[column.key]}
            nodes={nodes}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMemoryDrop={handleMemoryDrop}
            onMemoryRemove={handleMemoryRemove}
            dropTargetId={dropTargetId}
            onSetDropTarget={setDropTargetId}
          />
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-slide-in">
          {toast}
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewTaskModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority | "")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">No priority</option>
                  <option value="P0">P0 - Critical</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Medium</option>
                  <option value="P3">P3 - Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
