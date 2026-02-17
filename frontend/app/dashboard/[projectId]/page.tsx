"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import type { MemoryNode, MemoryEdge, MemoryNodeType, MemoryFile, TaskWithMemory, TaskStatus, TeamMember } from "@/lib/types";
import { getGraph, saveGraph, addNode, updateNode, deleteNode, addEdge, updateEdge, deleteEdge, getTasks, saveTasks, attachMemoryToTask, detachMemoryFromTask, deleteTask, getTeamMembers, addTeamMember, removeTeamMember } from "@/lib/storage/graphStore";
import { saveFile } from "@/lib/storage/fileStore";
import { MemoryGraphCanvas } from "@/components/memory/MemoryGraphCanvas";
import { MemoryInspector } from "@/components/memory/MemoryInspector";

const NODE_TYPES: { value: MemoryNodeType; label: string; icon: string }[] = [
  { value: "fact", label: "Fact", icon: "📝" },
  { value: "decision", label: "Decision", icon: "⚖️" },
  { value: "preference", label: "Preference", icon: "⭐" },
  { value: "risk", label: "Risk", icon: "⚠️" },
  { value: "note", label: "Note", icon: "📌" },
  { value: "link", label: "Link", icon: "🔗" },
  { value: "file", label: "File", icon: "📎" },
];

const nodeTypeIcons: Record<string, string> = {
  fact: "📝",
  decision: "⚖️",
  preference: "⭐",
  risk: "⚠️",
  note: "📌",
  link: "🔗",
  file: "📎",
};

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

// ============ Memory Chip Component ============
function MemoryChip({ node, onRemove }: { node: MemoryNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] bg-purple-50 text-purple-700 rounded-full">
      <span>{nodeTypeIcons[node.type] || "📝"}</span>
      <span className="max-w-[60px] truncate">{node.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:text-red-500 transition-colors"
        aria-label={`Remove ${node.title}`}
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ============ Compact Task Card ============
function TaskCard({
  task,
  nodes,
  teamMembers,
  projectId,
  onMemoryDrop,
  onMemoryRemove,
  onAssign,
  onDelete,
  isDropTarget,
  onSetDropTarget,
  onStatusChange,
  onRunAgent,
}: {
  task: TaskWithMemory;
  nodes: MemoryNode[];
  teamMembers: TeamMember[];
  projectId: string;
  onMemoryDrop: (taskId: string, nodeId: string) => void;
  onMemoryRemove: (taskId: string, nodeId: string) => void;
  onAssign: (taskId: string, owner: string | null, ownerType: "human" | "agent") => void;
  onDelete: (taskId: string) => void;
  isDropTarget: boolean;
  onSetDropTarget: (taskId: string | null) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onRunAgent: (task: TaskWithMemory) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const priority = task.priority ? priorityConfig[task.priority] : null;
  const attachedNodes = task.memoryRefs
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is MemoryNode => n !== undefined);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-momentum-node")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      onSetDropTarget(task.id);
    }
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
      onDragOver={handleDragOver}
      onDragLeave={() => onSetDropTarget(null)}
      onDrop={handleDrop}
      className={`relative bg-white border rounded-lg p-2.5 transition-all group ${
        isDropTarget
          ? "border-purple-400 ring-2 ring-purple-200 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {isDropTarget && (
        <div className="absolute inset-0 bg-purple-50/50 rounded-lg flex items-center justify-center pointer-events-none z-10">
          <span className="text-[10px] text-purple-600 font-medium">Drop to attach</span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {priority && (
          <span className={`px-1 py-0.5 text-[9px] font-medium rounded ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
        )}
        {task.owner_type === "agent" && (
          <span className="px-1 py-0.5 text-[9px] bg-blue-50 text-blue-700 rounded">Agent</span>
        )}
        <div className="flex-1" />
        {/* Menu button - always visible for better discoverability */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                <div className="px-2 py-1 text-[9px] text-gray-500 uppercase">Assign to</div>
                <button
                  onClick={() => {
                    onAssign(task.id, "Agent", "agent");
                    setShowMenu(false);
                  }}
                  className="w-full px-2 py-1.5 text-left text-[11px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px]">🤖</span>
                  AI Agent
                </button>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      onAssign(task.id, member.name, "human");
                      setShowMenu(false);
                    }}
                    className="w-full px-2 py-1.5 text-left text-[11px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                    {member.name}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    onRunAgent(task);
                    setShowMenu(false);
                  }}
                  className="w-full px-2 py-1.5 text-left text-[11px] text-green-700 hover:bg-green-50 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  Run with Agent
                </button>
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-2 py-1.5 text-left text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{task.title}</div>

      {/* Owner */}
      {task.owner && (
        <div className="flex items-center gap-1 mb-1">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium ${
            task.owner_type === "agent" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
          }`}>
            {task.owner_type === "agent" ? "🤖" : task.owner.charAt(0).toUpperCase()}
          </span>
          <span className="text-[10px] text-gray-500">{task.owner}</span>
        </div>
      )}

      {/* Attached Memory */}
      {attachedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {attachedNodes.slice(0, 3).map((node) => (
            <MemoryChip
              key={node.id}
              node={node}
              onRemove={() => onMemoryRemove(task.id, node.id)}
            />
          ))}
          {attachedNodes.length > 3 && (
            <span className="text-[9px] text-gray-400">+{attachedNodes.length - 3}</span>
          )}
        </div>
      )}

      {/* Status dropdown at bottom */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          onClick={(e) => e.stopPropagation()}
          className="text-[9px] border-0 bg-transparent text-gray-400 cursor-pointer focus:outline-none"
        >
          <option value="todo">To Do</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}

// ============ Tasks Panel ============
function TasksPanel({
  tasks,
  nodes,
  projectId,
  onTasksChange,
  onNodesChange,
  onEdgesChange,
  dropTargetId,
  onSetDropTarget,
}: {
  tasks: TaskWithMemory[];
  nodes: MemoryNode[];
  projectId: string;
  onTasksChange: (tasks: TaskWithMemory[]) => void;
  onNodesChange: (nodes: MemoryNode[]) => void;
  onEdgesChange: (edges: MemoryEdge[]) => void;
  dropTargetId: string | null;
  onSetDropTarget: (taskId: string | null) => void;
}) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Agent run state
  const [runningTask, setRunningTask] = useState<TaskWithMemory | null>(null);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<Array<{ name: string; status: string; output?: string }>>([]);
  const [agentProvider, setAgentProvider] = useState<"openclaw" | "backboard" | "mock" | null>(null);
  const [agentTaskType, setAgentTaskType] = useState<string | null>(null);

  // Email task state
  const [pendingEmailTask, setPendingEmailTask] = useState<TaskWithMemory | null>(null);
  const [emailRecipient, setEmailRecipient] = useState("");

  // Create email task modal state
  const [showEmailTaskModal, setShowEmailTaskModal] = useState(false);
  const [emailTaskRecipient, setEmailTaskRecipient] = useState("");
  const [emailTaskSubject, setEmailTaskSubject] = useState("");
  const [emailTaskDetails, setEmailTaskDetails] = useState("");
  const [emailTaskRunImmediately, setEmailTaskRunImmediately] = useState(true);
  const [emailTaskMemories, setEmailTaskMemories] = useState<string[]>([]);
  const [emailMemorySearch, setEmailMemorySearch] = useState("");
  const [showMemoryPicker, setShowMemoryPicker] = useState(false);

  // Memory suggestion approval state
  interface SuggestedMemory {
    id: string;
    type: MemoryNodeType;
    title: string;
    content: string;
    approved: boolean;
  }
  const [suggestedMemories, setSuggestedMemories] = useState<SuggestedMemory[]>([]);
  const [showMemoryApproval, setShowMemoryApproval] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTeamMembers(getTeamMembers(projectId));
  }, [projectId]);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const handleMemoryDrop = (taskId: string, nodeId: string) => {
    const success = attachMemoryToTask(projectId, taskId, nodeId);
    if (success) {
      onTasksChange(getTasks(projectId));
      const node = nodes.find((n) => n.id === nodeId);
      setToast(`Attached "${node?.title || "memory"}"`);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleMemoryRemove = (taskId: string, nodeId: string) => {
    detachMemoryFromTask(projectId, taskId, nodeId);
    onTasksChange(getTasks(projectId));
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
    );
    saveTasks(projectId, updated);
    onTasksChange(updated);
  };

  const handleAssign = (taskId: string, owner: string | null, ownerType: "human" | "agent") => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, owner, owner_type: ownerType, updated_at: new Date().toISOString() } : t
    );
    saveTasks(projectId, updated);
    onTasksChange(updated);
    setToast(`Assigned to ${owner}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(projectId, taskId);
    onTasksChange(getTasks(projectId));
    setToast("Task deleted");
    setTimeout(() => setToast(null), 2000);
  };

  // Check if a task is an email task
  const isEmailTask = (task: TaskWithMemory) => {
    const text = `${task.title} ${task.description || ""}`.toLowerCase();
    return text.includes("email") || text.includes("write email") || text.includes("draft email");
  };

  // Extract potential memories from agent output
  const extractMemoriesFromOutput = (output: string, task: TaskWithMemory): SuggestedMemory[] => {
    const suggestions: SuggestedMemory[] = [];
    const timestamp = Date.now();

    // Always create a "task completed" fact
    suggestions.push({
      id: `mem_${timestamp}_completion`,
      type: "fact",
      title: `Completed: ${task.title.replace(/^Write email:\s*/i, "").slice(0, 50)}`,
      content: `Task "${task.title}" was completed successfully on ${new Date().toLocaleDateString()}.`,
      approved: true,
    });

    // Extract key decisions or actions from output
    const lines = output.split("\n").filter(l => l.trim());

    // Look for subject lines in emails
    const subjectMatch = output.match(/Subject:\s*(.+)/i);
    if (subjectMatch) {
      suggestions.push({
        id: `mem_${timestamp}_subject`,
        type: "decision",
        title: `Email sent: ${subjectMatch[1].slice(0, 40)}`,
        content: `Email with subject "${subjectMatch[1]}" was drafted and sent.`,
        approved: true,
      });
    }

    // Look for meeting/scheduling info
    const meetingMatch = output.match(/meeting.*?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today).*?(\d{1,2}[:\d]*\s*(am|pm)?)/i);
    if (meetingMatch) {
      suggestions.push({
        id: `mem_${timestamp}_meeting`,
        type: "fact",
        title: `Meeting scheduled: ${meetingMatch[1]} ${meetingMatch[2]}`,
        content: `A meeting was scheduled for ${meetingMatch[1]} at ${meetingMatch[2]}.`,
        approved: true,
      });
    }

    // Look for recommendations or next steps
    const recommendationPatterns = [
      /recommend(?:ation)?s?:?\s*(.+)/i,
      /next steps?:?\s*(.+)/i,
      /action items?:?\s*(.+)/i,
    ];
    for (const pattern of recommendationPatterns) {
      const match = output.match(pattern);
      if (match) {
        suggestions.push({
          id: `mem_${timestamp}_rec_${suggestions.length}`,
          type: "note",
          title: "Recommendation from agent",
          content: match[1].slice(0, 200),
          approved: false,
        });
        break;
      }
    }

    return suggestions;
  };

  const handleRunAgent = async (task: TaskWithMemory, sendEmail = false, emailTo = "") => {
    // If it's an email task and we haven't collected recipient yet, show dialog
    if (isEmailTask(task) && !sendEmail && !pendingEmailTask) {
      setPendingEmailTask(task);
      setEmailRecipient("");
      return;
    }

    setRunningTask(task);
    setPendingEmailTask(null);
    setAgentLoading(true);
    setAgentOutput(null);
    setAgentProvider(null);
    setAgentTaskType(null);
    setAgentSteps([
      { name: "Initializing agent", status: "running" },
    ]);

    // Update task to "doing" status
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: "doing" as TaskStatus, owner: "Agent", owner_type: "agent" as const, updated_at: new Date().toISOString() } : t
    );
    saveTasks(projectId, updated);
    onTasksChange(updated);

    try {
      // Get attached memory nodes for context
      const attachedMemories = task.memoryRefs
        .map((id) => nodes.find((n) => n.id === id))
        .filter((n): n is MemoryNode => n !== undefined)
        .map((n) => ({ title: n.title, content: n.content, type: n.type }));

      setAgentSteps([
        { name: "Initializing agent", status: "success" },
        { name: "Gathering context", status: "running" },
      ]);

      await new Promise((r) => setTimeout(r, 500)); // Visual delay

      setAgentSteps([
        { name: "Initializing agent", status: "success" },
        { name: "Gathering context", status: "success", output: `${attachedMemories.length} memories loaded` },
        { name: "Executing task", status: "running" },
      ]);

      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            taskId: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            memoryContext: attachedMemories,
          },
          memories: attachedMemories,
          projectName: projectId.replace(/-/g, " "),
          sendEmail: sendEmail && !!emailTo,
          emailTo: emailTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run agent");
      }

      setAgentSteps(data.steps || [
        { name: "Initializing agent", status: "success" },
        { name: "Gathering context", status: "success" },
        { name: "Executing task", status: "success" },
        { name: "Generating output", status: "success" },
      ]);
      setAgentOutput(data.output);
      setAgentProvider(data.provider || null);
      setAgentTaskType(data.taskType || null);

      // Update task to "done"
      const finalUpdated = tasks.map((t) =>
        t.id === task.id ? { ...t, status: "done" as TaskStatus, updated_at: new Date().toISOString() } : t
      );
      saveTasks(projectId, finalUpdated);
      onTasksChange(finalUpdated);

      // Extract and suggest memories from the output
      const memories = extractMemoriesFromOutput(data.output, task);
      if (memories.length > 0) {
        setSuggestedMemories(memories);
        setCompletedTaskId(task.id);
        // Show approval modal after a short delay
        setTimeout(() => setShowMemoryApproval(true), 500);
      }

      setToast(data.emailSent ? `Email sent to ${data.emailTo}!` : "Task completed by agent!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setAgentSteps((prev) => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], status: "failed", output: err instanceof Error ? err.message : "Unknown error" },
      ]);
      setAgentOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const now = new Date().toISOString();
    const newTask: TaskWithMemory = {
      id: "task_" + Date.now(),
      project_id: projectId,
      title: newTaskTitle.trim(),
      description: null,
      priority: null,
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
    const updated = [...tasks, newTask];
    saveTasks(projectId, updated);
    onTasksChange(updated);
    setNewTaskTitle("");
    setShowNewTask(false);
  };

  const handleCreateEmailTask = () => {
    if (!emailTaskRecipient.trim() || !emailTaskSubject.trim()) return;

    // Build description with attached memories context
    const attachedMemoryNodes = emailTaskMemories
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is MemoryNode => n !== undefined);

    let description = `Send to: ${emailTaskRecipient.trim()}\n\nDetails:\n${emailTaskDetails.trim() || "Write a professional email about the subject above."}`;

    if (attachedMemoryNodes.length > 0) {
      description += "\n\n---\nReference Context:\n";
      attachedMemoryNodes.forEach(node => {
        description += `• [${node.type}] ${node.title}: ${node.content}\n`;
      });
    }

    const now = new Date().toISOString();
    const newTask: TaskWithMemory = {
      id: "task_email_" + Date.now(),
      project_id: projectId,
      title: `Write email: ${emailTaskSubject.trim()}`,
      description,
      priority: "P1",
      owner: null,
      owner_type: "human",
      due: null,
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: [...emailTaskMemories],
    };

    const updated = [...tasks, newTask];
    saveTasks(projectId, updated);
    onTasksChange(updated);

    // Reset form
    const recipient = emailTaskRecipient;
    setEmailTaskRecipient("");
    setEmailTaskSubject("");
    setEmailTaskDetails("");
    setEmailTaskMemories([]);
    setEmailMemorySearch("");
    setShowMemoryPicker(false);
    setShowEmailTaskModal(false);

    // If run immediately is checked, run the agent right away
    if (emailTaskRunImmediately) {
      // Small delay to let the UI update
      setTimeout(() => {
        handleRunAgent(newTask, true, recipient);
      }, 100);
    } else {
      setToast("Email task created!");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !newMemberName.trim()) return;
    addTeamMember(projectId, newMemberEmail.trim(), newMemberName.trim());
    setTeamMembers(getTeamMembers(projectId));
    setNewMemberEmail("");
    setNewMemberName("");
    setToast(`Added ${newMemberName}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleRemoveMember = (memberId: string) => {
    removeTeamMember(projectId, memberId);
    setTeamMembers(getTeamMembers(projectId));
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Tasks</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEmailTaskModal(true)}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Create email task"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowTeamModal(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Manage team"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowNewTask(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Add task"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick add */}
      {showNewTask && (
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateTask();
              if (e.key === "Escape") setShowNewTask(false);
            }}
            placeholder="Task title..."
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
            autoFocus
          />
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={handleCreateTask}
              className="px-2 py-1 text-[10px] bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewTask(false)}
              className="px-2 py-1 text-[10px] text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {COLUMNS.map((column) => (
          <div key={column.key}>
            <div className={`flex items-center gap-2 mb-1.5 pb-1 border-b-2 ${column.color}`}>
              <span className="text-[10px] font-medium text-gray-700">{column.label}</span>
              <span className="text-[9px] text-gray-400">{tasksByStatus[column.key].length}</span>
            </div>
            <div className="space-y-1.5">
              {tasksByStatus[column.key].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  nodes={nodes}
                  teamMembers={teamMembers}
                  projectId={projectId}
                  onMemoryDrop={handleMemoryDrop}
                  onMemoryRemove={handleMemoryRemove}
                  onAssign={handleAssign}
                  onDelete={handleDelete}
                  isDropTarget={dropTargetId === task.id}
                  onSetDropTarget={onSetDropTarget}
                  onStatusChange={handleStatusChange}
                  onRunAgent={handleRunAgent}
                />
              ))}
              {tasksByStatus[column.key].length === 0 && (
                <div className="py-2 text-center text-[10px] text-gray-400">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg animate-slide-in z-50">
          {toast}
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTeamModal(false)} />
          <div className="relative bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Team Members</h2>

            {/* Current members */}
            <div className="space-y-2 mb-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-[10px] text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-xs font-medium text-gray-600 mb-2">Add team member</div>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
              <button
                onClick={handleAddMember}
                disabled={!newMemberEmail.trim() || !newMemberName.trim()}
                className="w-full mt-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Add Member
              </button>
            </div>

            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Agent Run Modal */}
      {runningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !agentLoading && setRunningTask(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agentLoading ? "bg-blue-100" : agentOutput?.startsWith("Error") ? "bg-red-100" : "bg-green-100"}`}>
                  {agentLoading ? (
                    <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : agentOutput?.startsWith("Error") ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {agentLoading ? "Agent Running..." : agentOutput?.startsWith("Error") ? "Agent Failed" : "Task Completed"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{runningTask.title}</p>
                    {agentProvider && (
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-medium ${
                        agentProvider === "openclaw" ? "bg-green-100 text-green-700" :
                        agentProvider === "backboard" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {agentProvider === "openclaw" ? "OpenClaw" :
                         agentProvider === "backboard" ? "Backboard" : "Demo"}
                      </span>
                    )}
                    {agentTaskType && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded-full">
                        {agentTaskType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!agentLoading && (
                <button
                  onClick={() => setRunningTask(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Steps */}
            <div className="p-4 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-500 mb-2">Progress</div>
              <div className="space-y-2">
                {agentSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      step.status === "running" ? "bg-blue-100 text-blue-600" :
                      step.status === "success" ? "bg-green-100 text-green-600" :
                      step.status === "failed" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {step.status === "running" ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : step.status === "success" ? "✓" : step.status === "failed" ? "✕" : "○"}
                    </div>
                    <span className="text-xs text-gray-700">{step.name}</span>
                    {step.output && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{step.output}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            {agentOutput && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Agent Output</div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {agentOutput}
                </div>
              </div>
            )}

            {/* Footer */}
            {!agentLoading && (
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setRunningTask(null)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Email Task Modal */}
      {showEmailTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEmailTaskModal(false); setEmailTaskMemories([]); setEmailMemorySearch(""); setShowMemoryPicker(false); }} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Create Email Task</h2>
                <p className="text-xs text-gray-500">AI will write and send the email for you</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Send to</label>
                <input
                  type="email"
                  value={emailTaskRecipient}
                  onChange={(e) => setEmailTaskRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject / Purpose</label>
                <input
                  type="text"
                  value={emailTaskSubject}
                  onChange={(e) => setEmailTaskSubject(e.target.value)}
                  placeholder="e.g., Schedule meeting for Tuesday 10:00 AM"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">What to include (optional)</label>
                <textarea
                  value={emailTaskDetails}
                  onChange={(e) => setEmailTaskDetails(e.target.value)}
                  placeholder="e.g., Meeting is about Q1 planning. Include agenda items: budget review, team updates, goals for next quarter. Keep tone friendly but professional."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Memory search and select */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reference from Memory
                </label>

                {/* Selected memories */}
                {emailTaskMemories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {emailTaskMemories.map(memId => {
                      const node = nodes.find(n => n.id === memId);
                      if (!node) return null;
                      return (
                        <span
                          key={memId}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                        >
                          <span>{nodeTypeIcons[node.type] || "📝"}</span>
                          <span className="max-w-[120px] truncate">{node.title}</span>
                          <button
                            onClick={() => setEmailTaskMemories(emailTaskMemories.filter(id => id !== memId))}
                            className="hover:text-red-500 transition-colors ml-0.5"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={emailMemorySearch}
                    onChange={(e) => {
                      setEmailMemorySearch(e.target.value);
                      setShowMemoryPicker(true);
                    }}
                    onFocus={() => setShowMemoryPicker(true)}
                    onBlur={() => setTimeout(() => setShowMemoryPicker(false), 150)}
                    placeholder="Search memories to add..."
                    className="w-full px-3 py-2 pl-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {/* Memory picker dropdown */}
                  {showMemoryPicker && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {/* Debug: show count */}
                      <div className="px-3 py-1 text-[10px] text-gray-400 border-b border-gray-100">
                        {nodes.length} memories available
                      </div>
                      {nodes
                        .filter(n =>
                          !emailTaskMemories.includes(n.id) &&
                          (emailMemorySearch === "" ||
                            n.title.toLowerCase().includes(emailMemorySearch.toLowerCase()) ||
                            n.content.toLowerCase().includes(emailMemorySearch.toLowerCase()) ||
                            n.type.toLowerCase().includes(emailMemorySearch.toLowerCase()) ||
                            n.tags.some(t => t.toLowerCase().includes(emailMemorySearch.toLowerCase())))
                        )
                        .slice(0, 8)
                        .map(node => (
                          <button
                            key={node.id}
                            onClick={() => {
                              setEmailTaskMemories([...emailTaskMemories, node.id]);
                              setEmailMemorySearch("");
                              setShowMemoryPicker(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-sm">{nodeTypeIcons[node.type] || "📝"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{node.title}</div>
                              <div className="text-xs text-gray-500 truncate">{node.content}</div>
                            </div>
                          </button>
                        ))}
                      {nodes.filter(n => !emailTaskMemories.includes(n.id)).length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500">No memories available</div>
                      )}
                      {emailMemorySearch && nodes.filter(n =>
                        !emailTaskMemories.includes(n.id) &&
                        (n.title.toLowerCase().includes(emailMemorySearch.toLowerCase()) ||
                          n.content.toLowerCase().includes(emailMemorySearch.toLowerCase()))
                      ).length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500">No matches found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="runImmediately"
                  checked={emailTaskRunImmediately}
                  onChange={(e) => setEmailTaskRunImmediately(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="runImmediately" className="text-xs text-gray-600">
                  Generate and send immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowEmailTaskModal(false); setEmailTaskMemories([]); setEmailMemorySearch(""); setShowMemoryPicker(false); }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEmailTask}
                disabled={!emailTaskRecipient.trim() || !emailTaskSubject.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {emailTaskRunImmediately ? "Create & Send" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Recipient Dialog */}
      {pendingEmailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingEmailTask(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Send Email</h2>
                <p className="text-xs text-gray-500">Agent will write and send the email</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Task</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-2">{pendingEmailTask.title}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Send to email address</label>
              <input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  // Run without sending - just generate
                  handleRunAgent(pendingEmailTask, false, "");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Generate Only
              </button>
              <button
                onClick={() => {
                  if (emailRecipient) {
                    handleRunAgent(pendingEmailTask, true, emailRecipient);
                  }
                }}
                disabled={!emailRecipient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Generate & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Approval Modal */}
      {showMemoryApproval && suggestedMemories.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMemoryApproval(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">New Memories Detected</h2>
                  <p className="text-xs text-gray-500">Backboard extracted these insights from the task</p>
                </div>
              </div>
            </div>

            {/* Memory suggestions list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {suggestedMemories.map((mem, idx) => (
                <div
                  key={mem.id}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    mem.approved
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setSuggestedMemories(prev =>
                      prev.map((m, i) => i === idx ? { ...m, approved: !m.approved } : m)
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      mem.approved ? "bg-purple-600 border-purple-600" : "border-gray-300"
                    }`}>
                      {mem.approved && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{nodeTypeIcons[mem.type] || "📝"}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">{mem.type}</span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">{mem.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{mem.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {suggestedMemories.filter(m => m.approved).length} of {suggestedMemories.length} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMemoryApproval(false);
                    setSuggestedMemories([]);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Skip All
                </button>
                <button
                  onClick={() => {
                    const approved = suggestedMemories.filter(m => m.approved);
                    // Add each memory - addNode generates id, project_id, timestamps
                    approved.forEach(mem => {
                      addNode(projectId, {
                        type: mem.type,
                        title: mem.title,
                        content: mem.content,
                        tags: ["auto-generated", "backboard"],
                        files: [],
                        parentId: null,
                        pinned: false,
                        collapsed: false,
                        x: 100 + Math.random() * 300,
                        y: 100 + Math.random() * 200,
                      });
                    });
                    // Get fresh data from storage and update parent state
                    const graph = getGraph(projectId);
                    const migratedNodes = graph.nodes.map(n => ({
                      ...n,
                      parentId: n.parentId ?? null,
                      collapsed: n.collapsed ?? false,
                    }));
                    onNodesChange(migratedNodes);
                    onEdgesChange(graph.edges);
                    setShowMemoryApproval(false);
                    setSuggestedMemories([]);
                    setToast(`Added ${approved.length} memories to the graph!`);
                    setTimeout(() => setToast(null), 3000);
                  }}
                  disabled={suggestedMemories.filter(m => m.approved).length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Main Dashboard ============
export default function DashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // Memory Graph state
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [edges, setEdges] = useState<MemoryEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewNodeModal, setShowNewNodeModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<MemoryNodeType>("note");
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tasks state
  const [tasks, setTasks] = useState<TaskWithMemory[]>([]);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Panel visibility
  const [showInspector, setShowInspector] = useState(true);

  // Report generation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const graph = getGraph(projectId);
    // Ensure all nodes have the new fields
    const migratedNodes = graph.nodes.map(n => ({
      ...n,
      parentId: n.parentId ?? null,
      collapsed: n.collapsed ?? false,
    }));
    setNodes(migratedNodes);
    setEdges(graph.edges);
    setTasks(getTasks(projectId));
  }, [projectId]);

  // Save graph on changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveGraph(projectId, { nodes, edges });
    }
  }, [projectId, nodes, edges]);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) || null : null;

  // Get root nodes (no parent) and child nodes
  const rootNodes = nodes.filter(n => !n.parentId);
  const getChildren = (parentId: string) => nodes.filter(n => n.parentId === parentId);

  // Node operations
  const handleCreateNode = useCallback(() => {
    if (!newNodeTitle.trim()) return;
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    const newNode = addNode(projectId, {
      title: newNodeTitle.trim(),
      content: "",
      type: newNodeType,
      tags: [],
      pinned: false,
      x,
      y,
      files: [],
      parentId: null,
      collapsed: false,
    });
    setNodes((prev) => [...prev, newNode]);
    setNewNodeTitle("");
    setNewNodeType("note");
    setShowNewNodeModal(false);
    setSelectedNodeId(newNode.id);
  }, [projectId, newNodeTitle, newNodeType]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<MemoryNode>) => {
    const updated = updateNode(projectId, nodeId, updates);
    if (updated) {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? updated : n)));
    }
  }, [projectId]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Also delete children
    const children = nodes.filter(n => n.parentId === nodeId);
    children.forEach(child => deleteNode(projectId, child.id));
    deleteNode(projectId, nodeId);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId && n.parentId !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [projectId, nodes]);

  const handleMoveNode = useCallback((nodeId: string, x: number, y: number) => {
    handleUpdateNode(nodeId, { x, y });
  }, [handleUpdateNode]);

  // Nest node into another (drop node onto node)
  const handleNestNode = useCallback((childId: string, parentId: string | null) => {
    if (childId === parentId) return; // Can't nest into self
    // Check for circular reference
    let current = parentId;
    while (current) {
      if (current === childId) return; // Would create cycle
      const parent = nodes.find(n => n.id === current);
      current = parent?.parentId || null;
    }
    handleUpdateNode(childId, { parentId });
  }, [handleUpdateNode, nodes]);

  // Edge operations
  const handleCreateEdge = useCallback((sourceId: string, targetId: string) => {
    const newEdge = addEdge(projectId, sourceId, targetId, null);
    setEdges((prev) => {
      if (prev.some((e) => e.source === sourceId && e.target === targetId)) return prev;
      return [...prev, newEdge];
    });
  }, [projectId]);

  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<MemoryEdge>) => {
    const updated = updateEdge(projectId, edgeId, updates);
    if (updated) {
      setEdges((prev) => prev.map((e) => (e.id === edgeId ? updated : e)));
    }
  }, [projectId]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    deleteEdge(projectId, edgeId);
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setSelectedEdgeId(null);
  }, [projectId]);

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    for (const file of Array.from(e.target.files)) {
      try {
        const stored = await saveFile(file);
        const fileData: MemoryFile = {
          id: stored.id,
          name: stored.name,
          type: stored.type,
          size: stored.size,
          createdAt: stored.createdAt,
        };
        const x = 100 + Math.random() * 300;
        const y = 100 + Math.random() * 300;
        const newNode = addNode(projectId, {
          title: file.name,
          content: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          type: "file",
          tags: [file.type.split("/")[0]],
          pinned: false,
          x,
          y,
          files: [fileData],
          parentId: null,
          collapsed: false,
        });
        setNodes((prev) => [...prev, newNode]);
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    }
    e.target.value = "";
  };

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 220;
    const updatedNodes = nodes.map((node, i) => ({
      ...node,
      x: 50 + (i % cols) * spacing,
      y: 50 + Math.floor(i / cols) * spacing,
      updated_at: new Date().toISOString(),
    }));
    setNodes(updatedNodes);
    saveGraph(projectId, { nodes: updatedNodes, edges });
  }, [nodes, edges, projectId]);

  // Generate report using Backboard API
  const handleGenerateReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    setShowReportModal(true);

    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            title: n.title,
            content: n.content,
            type: n.type,
            tags: n.tags,
            pinned: n.pinned,
          })),
          tasks: tasks.map((t) => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            owner: t.owner,
            owner_type: t.owner_type,
            due: t.due,
          })),
          projectName: projectId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReportContent(data.report);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  }, [nodes, tasks, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && !(e.target as HTMLElement)?.closest("input, textarea")) {
        if (selectedNodeId) handleDeleteNode(selectedNodeId);
        else if (selectedEdgeId) handleDeleteEdge(selectedEdgeId);
      }
      if (e.key === "l" && !e.metaKey && !e.ctrlKey && !(e.target as HTMLElement)?.closest("input, textarea")) {
        setLinkMode((prev) => !prev);
        setLinkSourceId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge]);

  return (
    <div className="h-full flex">
      {/* Left: Memory Graph */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
          <button
            onClick={() => setShowNewNodeModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Node
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.mp3,.mp4,.wav,.webm,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => {
              setLinkMode(!linkMode);
              setLinkSourceId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs transition-colors ${
              linkMode ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Link
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            {reportLoading ? "Generating..." : "Report"}
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-32 pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <button
            onClick={handleAutoLayout}
            className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            title="Auto-layout"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 border rounded-lg transition-colors ${
              showInspector ? "bg-gray-100 border-gray-300" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
            title="Toggle inspector"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <div className="text-[10px] text-gray-400 px-2">
            {nodes.length} nodes · {edges.length} edges
          </div>
        </div>

        {/* Canvas + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <MemoryGraphCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              linkMode={linkMode}
              linkSourceId={linkSourceId}
              searchQuery={searchQuery}
              onSelectNode={setSelectedNodeId}
              onSelectEdge={setSelectedEdgeId}
              onMoveNode={handleMoveNode}
              onCreateEdge={handleCreateEdge}
              onSetLinkSource={setLinkSourceId}
              onDragNodeStart={() => {}}
            />
          </div>

          {showInspector && (
            <div className="w-64 border-l border-gray-200 bg-white">
              <MemoryInspector
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                onUpdateNode={handleUpdateNode}
                onUpdateEdge={handleUpdateEdge}
                onDeleteNode={handleDeleteNode}
                onDeleteEdge={handleDeleteEdge}
                onClose={() => {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Tasks Panel */}
      <div className="w-72 flex-shrink-0">
        <TasksPanel
          tasks={tasks}
          nodes={nodes}
          projectId={projectId}
          onTasksChange={setTasks}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          dropTargetId={dropTargetId}
          onSetDropTarget={setDropTargetId}
        />
      </div>

      {/* New Node Modal */}
      {showNewNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewNodeModal(false)} />
          <div className="relative bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Create Node</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {NODE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewNodeType(t.value)}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-colors ${
                        newNodeType === t.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[9px] text-gray-600">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  placeholder="Enter title..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowNewNodeModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNode}
                disabled={!newNodeTitle.trim()}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Development Status Report</h2>
                  <p className="text-xs text-gray-500">Generated by Backboard AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {reportLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm text-gray-600">Analyzing memory and tasks...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
                </div>
              )}

              {reportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Failed to generate report</h3>
                      <p className="text-sm text-red-600 mt-1">{reportError}</p>
                      <button
                        onClick={handleGenerateReport}
                        className="mt-3 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {reportContent && !reportLoading && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                    {reportContent.split('\n').map((line, i) => {
                      // Handle markdown-like headers
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-lg font-semibold text-gray-900 mt-5 mb-2">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-base font-medium text-gray-900 mt-4 mb-2">{line.slice(4)}</h3>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold text-gray-900 mt-3">{line.slice(2, -2)}</p>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4 text-gray-700">{line.slice(2)}</li>;
                      }
                      if (line.trim() === '') {
                        return <br key={i} />;
                      }
                      return <p key={i} className="text-gray-700">{line}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {reportContent && !reportLoading && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Based on {nodes.length} memory items and {tasks.length} tasks
                </p>
                <div className="flex items-center gap-2">
                  {/* Save to Memory as PDF */}
                  <button
                    onClick={async () => {
                      try {
                        // Dynamic import jsPDF
                        const { jsPDF } = await import("jspdf");
                        const doc = new jsPDF();
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const margin = 20;
                        const maxWidth = pageWidth - margin * 2;
                        let y = 20;

                        // Title
                        doc.setFontSize(20);
                        doc.setTextColor(124, 58, 237); // Purple
                        doc.text("Momentum Status Report", margin, y);
                        y += 10;

                        // Date
                        doc.setFontSize(10);
                        doc.setTextColor(156, 163, 175);
                        doc.text(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
                        y += 15;

                        // Content
                        doc.setTextColor(31, 41, 55);
                        const lines = reportContent.split('\n');

                        for (const line of lines) {
                          if (y > 270) {
                            doc.addPage();
                            y = 20;
                          }

                          if (line.startsWith('# ')) {
                            doc.setFontSize(16);
                            doc.setFont("helvetica", "bold");
                            y += 5;
                            doc.text(line.slice(2), margin, y);
                            y += 8;
                          } else if (line.startsWith('## ')) {
                            doc.setFontSize(14);
                            doc.setFont("helvetica", "bold");
                            y += 4;
                            doc.text(line.slice(3), margin, y);
                            y += 7;
                          } else if (line.startsWith('### ')) {
                            doc.setFontSize(12);
                            doc.setFont("helvetica", "bold");
                            y += 3;
                            doc.text(line.slice(4), margin, y);
                            y += 6;
                          } else if (line.startsWith('- ')) {
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "normal");
                            const bulletText = "• " + line.slice(2);
                            const splitText = doc.splitTextToSize(bulletText, maxWidth - 5);
                            doc.text(splitText, margin + 5, y);
                            y += splitText.length * 5;
                          } else if (line.trim() !== '') {
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "normal");
                            const cleanLine = line.replace(/\*\*/g, '');
                            const splitText = doc.splitTextToSize(cleanLine, maxWidth);
                            doc.text(splitText, margin, y);
                            y += splitText.length * 5;
                          } else {
                            y += 3;
                          }
                        }

                        // Footer
                        doc.setFontSize(8);
                        doc.setTextColor(156, 163, 175);
                        doc.text(`Generated by Momentum • ${nodes.length} memories • ${tasks.length} tasks`, margin, 285);

                        // Get PDF as blob
                        const pdfBlob = doc.output('blob');
                        const fileName = `Momentum_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

                        // Save file to IndexedDB
                        const storedFile = await saveFile(pdfFile);

                        // Create memory node with file
                        addNode(projectId, {
                          type: "file",
                          title: `Status Report - ${new Date().toLocaleDateString()}`,
                          content: `PDF report generated on ${new Date().toLocaleString()}. Contains ${nodes.length} memory items and ${tasks.length} tasks analysis.`,
                          tags: ["report", "pdf", "auto-generated", "backboard"],
                          files: [{ id: storedFile.id, name: storedFile.name, type: storedFile.type, size: storedFile.size }],
                          parentId: null,
                          pinned: true,
                          collapsed: false,
                          x: 400 + Math.random() * 100,
                          y: 100 + Math.random() * 100,
                        });

                        // Update graph
                        const graph = getGraph(projectId);
                        setNodes(graph.nodes.map(n => ({ ...n, parentId: n.parentId ?? null, collapsed: n.collapsed ?? false })));
                        setEdges(graph.edges);
                        setShowReportModal(false);

                        // Toast
                        const toast = document.createElement("div");
                        toast.className = "fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm flex items-center gap-2";
                        toast.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> PDF report saved to memory!';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3000);
                      } catch (err) {
                        console.error("Failed to generate PDF:", err);
                        alert("Failed to generate PDF. See console for details.");
                      }
                    }}
                    className="px-3 py-1.5 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Save PDF to Memory
                  </button>
                  {/* Download PDF */}
                  <button
                    onClick={async () => {
                      try {
                        const { jsPDF } = await import("jspdf");
                        const doc = new jsPDF();
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const margin = 20;
                        const maxWidth = pageWidth - margin * 2;
                        let y = 20;

                        // Title
                        doc.setFontSize(20);
                        doc.setTextColor(124, 58, 237);
                        doc.text("Momentum Status Report", margin, y);
                        y += 10;

                        // Date
                        doc.setFontSize(10);
                        doc.setTextColor(156, 163, 175);
                        doc.text(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
                        y += 15;

                        // Content
                        doc.setTextColor(31, 41, 55);
                        const lines = reportContent.split('\n');

                        for (const line of lines) {
                          if (y > 270) { doc.addPage(); y = 20; }
                          if (line.startsWith('# ')) {
                            doc.setFontSize(16); doc.setFont("helvetica", "bold"); y += 5;
                            doc.text(line.slice(2), margin, y); y += 8;
                          } else if (line.startsWith('## ')) {
                            doc.setFontSize(14); doc.setFont("helvetica", "bold"); y += 4;
                            doc.text(line.slice(3), margin, y); y += 7;
                          } else if (line.startsWith('### ')) {
                            doc.setFontSize(12); doc.setFont("helvetica", "bold"); y += 3;
                            doc.text(line.slice(4), margin, y); y += 6;
                          } else if (line.startsWith('- ')) {
                            doc.setFontSize(10); doc.setFont("helvetica", "normal");
                            const splitText = doc.splitTextToSize("• " + line.slice(2), maxWidth - 5);
                            doc.text(splitText, margin + 5, y); y += splitText.length * 5;
                          } else if (line.trim() !== '') {
                            doc.setFontSize(10); doc.setFont("helvetica", "normal");
                            const splitText = doc.splitTextToSize(line.replace(/\*\*/g, ''), maxWidth);
                            doc.text(splitText, margin, y); y += splitText.length * 5;
                          } else { y += 3; }
                        }

                        doc.setFontSize(8); doc.setTextColor(156, 163, 175);
                        doc.text(`Generated by Momentum • ${nodes.length} memories • ${tasks.length} tasks`, margin, 285);

                        doc.save(`Momentum_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                      } catch (err) {
                        console.error("PDF error:", err);
                      }
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                  {/* Copy to Clipboard */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportContent);
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = "Copied!";
                      setTimeout(() => { btn.textContent = originalText; }, 1500);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Copy
                  </button>
                  {/* Regenerate */}
                  <button
                    onClick={handleGenerateReport}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
