"use client";

import { TaskCard, type Task } from "./TaskCard";

const COLUMNS = [
  {
    id: "todo",
    label: "To Do",
    iconBg: "bg-status-todo/10",
    iconColor: "text-status-todo",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  },
  {
    id: "doing",
    label: "In Progress",
    iconBg: "bg-status-doing/10",
    iconColor: "text-status-doing",
    icon: "M13 10V3L4 14h7v7l9-11h-7z"
  },
  {
    id: "done",
    label: "Done",
    iconBg: "bg-status-done/10",
    iconColor: "text-status-done",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  },
] as const;

interface KanbanBoardProps {
  tasks: { todo: Task[]; doing: Task[]; done: Task[] };
  onMoveTask?: (taskId: string, columnId: string) => void;
  onSetBlocked?: (taskId: string, blocked: boolean, reason?: string) => void;
  onSendToOpenClaw?: (task: Task) => void;
}

function EmptyState({ column }: { column: string }) {
  const messages = {
    todo: { title: "No tasks yet", subtitle: "Add notes and generate a plan" },
    doing: { title: "Nothing in progress", subtitle: "Move tasks here to start" },
    done: { title: "No completed tasks", subtitle: "Finished tasks appear here" },
  };
  const msg = messages[column as keyof typeof messages] || messages.todo;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-background-alt flex items-center justify-center mb-2">
        <svg className="w-5 h-5 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-xs font-medium text-text-secondary mb-0.5">{msg.title}</p>
      <p className="text-[10px] text-text-secondary/70">{msg.subtitle}</p>
    </div>
  );
}

export function KanbanBoard({ tasks, onMoveTask, onSetBlocked, onSendToOpenClaw }: KanbanBoardProps) {
  return (
    <section className="flex gap-4 h-full" aria-label="Task board">
      {COLUMNS.map((col) => {
        const taskList = tasks[col.id] ?? [];
        const count = taskList.length;

        return (
          <div
            key={col.id}
            className={`flex-1 min-w-0 flex flex-col rounded-xl border border-border bg-white/80 backdrop-blur-sm ${
              col.id === "done" ? "opacity-90" : ""
            }`}
          >
            {/* Column Header */}
            <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${col.iconBg} flex items-center justify-center`}>
                <svg className={`w-3.5 h-3.5 ${col.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={col.icon} />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-text-primary flex-1 truncate">
                {col.label}
              </h2>
              <span className="text-xs font-medium text-text-secondary bg-background-alt px-2 py-0.5 rounded-full">
                {count}
              </span>
            </div>

            {/* Column Content */}
            <div className="p-2.5 flex flex-col gap-2.5 flex-1 overflow-y-auto">
              {count === 0 ? (
                <EmptyState column={col.id} />
              ) : (
                taskList.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentColumn={col.id}
                    isDoneColumn={col.id === "done"}
                    onMoveTo={onMoveTask ? (cid) => onMoveTask(task.id, cid) : undefined}
                    onSetBlocked={onSetBlocked ? (blocked, reason) => onSetBlocked(task.id, blocked, reason) : undefined}
                    onSendToOpenClaw={onSendToOpenClaw}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
