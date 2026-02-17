"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "./Header";
import { NotesPanel } from "./NotesPanel";
import { KanbanBoard } from "./KanbanBoard";
import { MemoryPanel } from "./MemoryPanel";
import { AskBox } from "./AskBox";
import { AutomationsPanel } from "./AutomationsPanel";
import { Toast, type ToastItem } from "./Toast";
import { TaskContextModal } from "./TaskContextModal";
import type { Task } from "./TaskCard";
import type { MemoryItem } from "./MemoryPanel";
import type { Automation } from "./AutomationsPanel";
import type { AgentPresenceState } from "./AgentPresence";
import type { PlanPreview } from "./NotesPanel";

interface CurrentData {
  project: { id: string; name: string; goal: string | null; deadline: string | null; repo_url: string | null } | null;
  tasks: { todo: Task[]; doing: Task[]; done: Task[] };
  memory: {
    decisions: MemoryItem[];
    preferences: MemoryItem[];
    risks: MemoryItem[];
    summary: MemoryItem[];
  };
  automations: Automation[];
}

const EMPTY_DATA: CurrentData = {
  project: null,
  tasks: { todo: [], doing: [], done: [] },
  memory: { decisions: [], preferences: [], risks: [], summary: [] },
  automations: [],
};

function addToast(toasts: ToastItem[], item: Omit<ToastItem, "id">): ToastItem[] {
  return [...toasts, { ...item, id: `toast-${Date.now()}` }];
}

export function Dashboard() {
  const [data, setData] = useState<CurrentData>(EMPTY_DATA);
  const [notes, setNotes] = useState("");
  const [agentStatus, setAgentStatus] = useState("");
  const [agentState, setAgentState] = useState<AgentPresenceState>("idle");
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [planPreview, setPlanPreview] = useState<PlanPreview | null>(null);
  const [taskForContext, setTaskForContext] = useState<Task | null>(null);

  const fetchCurrent = useCallback(async () => {
    const res = await fetch("/api/projects/current");
    const json = await res.json();
    setData({
      project: json.project,
      tasks: json.tasks ?? { todo: [], doing: [], done: [] },
      memory: {
        decisions: json.memory?.decisions ?? [],
        preferences: json.memory?.preferences ?? [],
        risks: json.memory?.risks ?? [],
        summary: json.memory?.summary ?? [],
      },
      automations: json.automations ?? [],
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const currentRes = await fetch("/api/projects/current");
        if (!currentRes.ok) {
          console.error("Failed to fetch project:", currentRes.status);
          setInitialLoading(false);
          return;
        }
        const current = await currentRes.json();
        setData({
          project: current.project,
          tasks: current.tasks ?? { todo: [], doing: [], done: [] },
          memory: {
            decisions: current.memory?.decisions ?? [],
            preferences: current.memory?.preferences ?? [],
            risks: current.memory?.risks ?? [],
            summary: current.memory?.summary ?? [],
          },
          automations: current.automations ?? [],
        });
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setAgentState("loading");
    setAgentStatus("Analyzing…");
    try {
      const res = await fetch("/api/plan/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAgentStatus("Review tasks below and apply.");
      setAgentState("success");
      setPlanPreview({
        summary: json.summary ?? "",
        decisions: json.decisions ?? [],
        preferences: json.preferences ?? [],
        tasks: (json.tasks ?? []).map((t: { title: string; description?: string; priority?: string; column_id?: string }) => ({
          title: t.title,
          description: t.description,
          priority: t.priority ?? "P2",
          column_id: t.column_id ?? "todo",
        })),
      });
    } catch (e) {
      setAgentStatus("Error generating plan.");
      setAgentState("idle");
      setToasts((t) => addToast(t, { message: String(e), success: false }));
    } finally {
      setLoading(false);
    }
  }, [notes]);

  const handleApplyPlan = useCallback(
    async (selected: { title: string; description?: string; priority: string; column_id: string }[]) => {
      if (!planPreview) return;
      setLoading(true);
      try {
        const res = await fetch("/api/plan/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: selected,
            decisions: planPreview.decisions,
            preferences: planPreview.preferences,
            summary: planPreview.summary,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setPlanPreview(null);
        setLastProcessed("Just now");
        setData((d) => ({ ...d, tasks: json.tasks ?? d.tasks }));
        await fetchCurrent();
        setAgentStatus(json.message ?? "Plan applied.");
      } catch (e) {
        setToasts((t) => addToast(t, { message: String(e), success: false }));
      } finally {
        setLoading(false);
      }
    },
    [planPreview, fetchCurrent]
  );

  const handleRepoUrlChange = useCallback(
    async (url: string) => {
      setData((d) => (d.project ? { ...d, project: { ...d.project, repo_url: url || null } } : d));
      try {
        await fetch("/api/projects/current/repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: url.trim() || null }),
        });
      } catch {
        // revert on error
        await fetchCurrent();
      }
    },
    [fetchCurrent]
  );

  const handleTranscribe = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Transcribe failed");
    const transcript = json.transcript ?? "";
    setNotes((n) => (n.trim() ? n + "\n\n" + transcript : transcript));
    setToasts((t) => addToast(t, { message: "Transcript added to notes.", success: true }));
  }, []);

  const handleUpdateFromProgress = useCallback(async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setAgentState("loading");
    setAgentStatus("Updating…");
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAgentStatus(json.message ?? "Progress updated.");
      setAgentState("success");
      setLastProcessed("Just now");
      setData((d) => ({ ...d, tasks: json.tasks ?? d.tasks }));
      await fetchCurrent();
    } catch (e) {
      setAgentStatus("Error updating.");
      setAgentState("idle");
      setToasts((t) => addToast(t, { message: String(e), success: false }));
    } finally {
      setLoading(false);
    }
  }, [notes, fetchCurrent]);

  const handleMoveTask = useCallback(
    async (taskId: string, columnId: string) => {
      await fetch(`/api/tasks/${taskId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column_id: columnId }),
      });
      await fetchCurrent();
    },
    [fetchCurrent]
  );

  const handleSetBlocked = useCallback(
    async (taskId: string, blocked: boolean, reason?: string) => {
      await fetch(`/api/tasks/${taskId}/blocked`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked, blocker_reason: reason }),
      });
      await fetchCurrent();
    },
    [fetchCurrent]
  );

  const handlePin = useCallback(
    async (id: string, pinned: boolean) => {
      await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      await fetchCurrent();
    },
    [fetchCurrent]
  );

  const handleCorrectMemory = useCallback(
    async (id: string, content: string) => {
      await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      await fetchCurrent();
    },
    [fetchCurrent]
  );

  const handleAsk = useCallback(async (question: string) => {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed");
    return { answer: json.answer, sources_used: json.sources_used ?? [] };
  }, []);

  const handleAutomationToggle = useCallback(
    async (id: string, enabled: boolean) => {
      await fetch("/api/automations/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automation_id: id, enabled }),
      });
      await fetchCurrent();
    },
    [fetchCurrent]
  );

  const handleAutomationRun = useCallback(async (id: string) => {
    const res = await fetch("/api/automations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automation_id: id }),
    });
    const json = await res.json();
    return { success: json.success !== false, message: json.message ?? "Done." };
  }, []);

  const showToast = useCallback((message: string, success: boolean) => {
    setToasts((t) => addToast(t, { message, success }));
  }, []);

  const handleSendToAgent = useCallback((task: Task) => {
    setTaskForContext(task);
  }, []);

  const handleConfirmContext = useCallback(async (task: Task, selectedMemory: MemoryItem[]) => {
    try {
      // Prepare context with Backboard
      const res = await fetch("/api/tasks/prepare-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            owner: task.owner,
            due: task.due,
          },
          selectedMemory: selectedMemory.map((m) => ({
            id: m.id,
            content: m.content,
            type: (m as MemoryItem & { type?: string }).type,
          })),
        }),
      });

      const json = await res.json();

      if (json.success && json.contextText) {
        // Copy to clipboard
        await navigator.clipboard.writeText(json.contextText);

        // Open OpenClaw
        window.open("https://openclaw.ai", "_blank", "noopener,noreferrer");

        showToast(
          json.backboardUsed
            ? `Context prepared with Backboard and copied. OpenClaw opened.`
            : `Task context copied. OpenClaw opened.`,
          true
        );
      } else {
        throw new Error(json.error || "Failed to prepare context");
      }
    } catch (error) {
      console.error("Error preparing context:", error);
      showToast("Failed to prepare context", false);
    } finally {
      setTaskForContext(null);
    }
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-text-secondary">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        goal={data.project?.goal ?? null}
        deadline={data.project?.deadline ?? null}
        agentStatus={agentStatus}
        agentState={agentState}
      />

      <main className="flex-1 flex min-h-0 flex-col lg:flex-row">
        {/* Left: Task Board (larger) */}
        <section className="flex-1 min-w-0 p-5 lg:p-6 flex flex-col bg-background-alt/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-text-primary">Task Board</h2>
            </div>
            <div className="text-xs text-text-secondary">
              {(data.tasks.todo.length + data.tasks.doing.length + data.tasks.done.length)} total tasks
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <KanbanBoard
              tasks={data.tasks}
              onMoveTask={handleMoveTask}
              onSetBlocked={handleSetBlocked}
              onSendToOpenClaw={handleSendToAgent}
            />
          </div>
        </section>

        {/* Right: Notes, Ask, Memory, Automations */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-white p-5 flex flex-col overflow-hidden">
          {/* Notes Section */}
          <div className="border-b border-border pb-4 mb-4">
            <NotesPanel
              value={notes}
              onChange={setNotes}
              onGeneratePlan={handleGeneratePlan}
              onUpdateFromProgress={handleUpdateFromProgress}
              loading={loading}
              lastProcessed={lastProcessed}
              repoUrl={data.project?.repo_url ?? null}
              onRepoUrlChange={handleRepoUrlChange}
              onTranscribe={handleTranscribe}
              planPreview={planPreview}
              onApplyPlan={handleApplyPlan}
              onDismissPlanPreview={() => setPlanPreview(null)}
            />
          </div>

          {/* Ask Momentum */}
          <AskBox onAsk={handleAsk} />

          {/* Memory Panel */}
          <div className="flex-1 min-h-0 overflow-y-auto mt-5 pr-1">
            <MemoryPanel
              decisions={data.memory.decisions}
              preferences={data.memory.preferences}
              risks={data.memory.risks}
              summary={data.memory.summary}
              onPin={handlePin}
              onCorrect={handleCorrectMemory}
            />
          </div>

          {/* Automations */}
          <AutomationsPanel
            automations={data.automations}
            onToggle={handleAutomationToggle}
            onRun={handleAutomationRun}
            onToast={showToast}
          />
        </aside>
      </main>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      <TaskContextModal
        isOpen={taskForContext !== null}
        task={taskForContext}
        memory={data.memory}
        onClose={() => setTaskForContext(null)}
        onConfirm={handleConfirmContext}
      />
    </div>
  );
}
