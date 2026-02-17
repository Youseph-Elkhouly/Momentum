"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from "react";
import type {
  Project,
  Task,
  Run,
  RunStep,
  ApprovalItem,
  MemoryItem,
  Automation,
  IntegrationConnection,
  AgentStatus,
  MemoryCategory,
  TaskStatus,
  TaskStage,
  RunStatus,
} from "./types";

// ============ State Types ============
export interface AppState {
  initialized: boolean;
  currentProjectId: string | null;
  projects: Project[];
  tasks: Task[];
  runs: Run[];
  approvals: ApprovalItem[];
  memory: MemoryItem[];
  automations: Automation[];
  integrations: IntegrationConnection[];
  agentStatus: AgentStatus;
  commandBarOpen: boolean;
  sidebarCollapsed: boolean;
}

// ============ Actions ============
type Action =
  | { type: "INIT"; payload: Partial<AppState> }
  | { type: "SET_PROJECT"; payload: string }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "SET_RUNS"; payload: Run[] }
  | { type: "ADD_RUN"; payload: Run }
  | { type: "UPDATE_RUN"; payload: Run }
  | { type: "UPDATE_RUN_STEP"; payload: { runId: string; step: RunStep } }
  | { type: "SET_APPROVALS"; payload: ApprovalItem[] }
  | { type: "ADD_APPROVAL"; payload: ApprovalItem }
  | { type: "UPDATE_APPROVAL"; payload: ApprovalItem }
  | { type: "REMOVE_APPROVAL"; payload: string }
  | { type: "SET_MEMORY"; payload: MemoryItem[] }
  | { type: "ADD_MEMORY"; payload: MemoryItem }
  | { type: "UPDATE_MEMORY"; payload: MemoryItem }
  | { type: "DELETE_MEMORY"; payload: string }
  | { type: "SET_AUTOMATIONS"; payload: Automation[] }
  | { type: "UPDATE_AUTOMATION"; payload: Automation }
  | { type: "SET_INTEGRATIONS"; payload: IntegrationConnection[] }
  | { type: "UPDATE_INTEGRATION"; payload: IntegrationConnection }
  | { type: "SET_AGENT_STATUS"; payload: AgentStatus }
  | { type: "TOGGLE_COMMAND_BAR"; payload?: boolean }
  | { type: "TOGGLE_SIDEBAR" };

// ============ Initial State ============
const initialState: AppState = {
  initialized: false,
  currentProjectId: null,
  projects: [],
  tasks: [],
  runs: [],
  approvals: [],
  memory: [],
  automations: [],
  integrations: [],
  agentStatus: { state: "ready", message: null, current_run_id: null },
  commandBarOpen: false,
  sidebarCollapsed: false,
};

// ============ Reducer ============
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "INIT":
      return { ...state, ...action.payload, initialized: true };
    case "SET_PROJECT":
      return { ...state, currentProjectId: action.payload };
    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload] };
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.payload] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case "SET_RUNS":
      return { ...state, runs: action.payload };
    case "ADD_RUN":
      return { ...state, runs: [action.payload, ...state.runs] };
    case "UPDATE_RUN":
      return {
        ...state,
        runs: state.runs.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case "UPDATE_RUN_STEP": {
      const { runId, step } = action.payload;
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id === runId
            ? { ...r, steps: r.steps.map((s) => (s.id === step.id ? step : s)) }
            : r
        ),
      };
    }
    case "SET_APPROVALS":
      return { ...state, approvals: action.payload };
    case "ADD_APPROVAL":
      return { ...state, approvals: [action.payload, ...state.approvals] };
    case "UPDATE_APPROVAL":
      return {
        ...state,
        approvals: state.approvals.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };
    case "REMOVE_APPROVAL":
      return { ...state, approvals: state.approvals.filter((a) => a.id !== action.payload) };
    case "SET_MEMORY":
      return { ...state, memory: action.payload };
    case "ADD_MEMORY":
      return { ...state, memory: [action.payload, ...state.memory] };
    case "UPDATE_MEMORY":
      return {
        ...state,
        memory: state.memory.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };
    case "DELETE_MEMORY":
      return { ...state, memory: state.memory.filter((m) => m.id !== action.payload) };
    case "SET_AUTOMATIONS":
      return { ...state, automations: action.payload };
    case "UPDATE_AUTOMATION":
      return {
        ...state,
        automations: state.automations.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };
    case "SET_INTEGRATIONS":
      return { ...state, integrations: action.payload };
    case "UPDATE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };
    case "SET_AGENT_STATUS":
      return { ...state, agentStatus: action.payload };
    case "TOGGLE_COMMAND_BAR":
      return {
        ...state,
        commandBarOpen: action.payload !== undefined ? action.payload : !state.commandBarOpen,
      };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    default:
      return state;
  }
}

// ============ Seed Data ============
function createSeedData(projectId: string): Partial<AppState> {
  const now = new Date().toISOString();

  const project: Project = {
    id: projectId,
    name: "Momentum MVP",
    goal: "Ship a minimal AI-powered project dashboard",
    deadline: "2026-03-30",
    repo_url: "https://github.com/momentum/dashboard",
    created_at: now,
    updated_at: now,
  };

  const tasks: Task[] = [
    {
      id: "task-1",
      project_id: projectId,
      title: "Review project scope",
      description: "Align with stakeholders on MVP features",
      priority: "P0",
      owner: "You",
      owner_type: "human",
      due: "2026-03-15",
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["All stakeholders sign off", "Scope document updated"],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-2",
      project_id: projectId,
      title: "Set up dev environment",
      description: "Configure Next.js, Tailwind, and tooling",
      priority: "P2",
      owner: null,
      owner_type: "human",
      due: "2026-03-18",
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-3",
      project_id: projectId,
      title: "Build dashboard UI",
      description: "Next.js + Tailwind implementation with agent-aware components",
      priority: "P1",
      owner: "Agent",
      owner_type: "agent",
      due: "2026-03-20",
      status: "doing",
      stage: "executing",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["Responsive layout", "All components render", "No console errors"],
      parent_task_id: null,
      created_by: "agent",
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-4",
      project_id: projectId,
      title: "Clone repository",
      description: null,
      priority: null,
      owner: null,
      owner_type: "human",
      due: null,
      status: "done",
      stage: "completed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
    },
    {
      id: "task-5",
      project_id: projectId,
      title: "Define requirements",
      description: "Document functional and non-functional requirements",
      priority: "P1",
      owner: "You",
      owner_type: "human",
      due: null,
      status: "done",
      stage: "completed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["PRD completed"],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
    },
  ];

  const memory: MemoryItem[] = [
    {
      id: "mem-1",
      project_id: projectId,
      category: "decision",
      content: "Use Next.js App Router and Tailwind only; no component libraries.",
      source: "Team meeting",
      pinned: true,
      in_working_set: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "mem-2",
      project_id: projectId,
      category: "preference",
      content: "Monochrome UI; documentation-first tone.",
      source: "Design review",
      pinned: false,
      in_working_set: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "mem-3",
      project_id: projectId,
      category: "risk",
      content: "Scope creep on first release — keep MVP tight.",
      source: "Planning session",
      pinned: true,
      in_working_set: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "mem-4",
      project_id: projectId,
      category: "fact",
      content: "Momentum MVP: minimal dashboard with agent runs, approval queue, and memory management.",
      source: "PRD",
      pinned: false,
      in_working_set: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "mem-5",
      project_id: projectId,
      category: "link",
      content: "https://github.com/momentum/dashboard - Main repository",
      source: null,
      pinned: false,
      in_working_set: false,
      created_at: now,
      updated_at: now,
    },
  ];

  const runs: Run[] = [
    {
      id: "run-1",
      project_id: projectId,
      name: "Generate UI components",
      description: "Creating dashboard components based on requirements",
      command: "/generate dashboard components",
      status: "success",
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3000000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      steps: [
        {
          id: "step-1-1",
          run_id: "run-1",
          order: 1,
          name: "Analyze requirements",
          tool: "internal",
          tool_action: "parse",
          input: { command: "/generate dashboard components" },
          output: { components: ["Sidebar", "TopBar", "KanbanBoard"] },
          status: "success",
          error: null,
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3500000).toISOString(),
          duration_ms: 100000,
          approval_required: false,
          approval_id: null,
        },
        {
          id: "step-1-2",
          run_id: "run-1",
          order: 2,
          name: "Generate code",
          tool: "openclaw",
          tool_action: "generate",
          input: { components: ["Sidebar", "TopBar", "KanbanBoard"] },
          output: { files_created: 3 },
          status: "success",
          error: null,
          started_at: new Date(Date.now() - 3500000).toISOString(),
          completed_at: new Date(Date.now() - 3000000).toISOString(),
          duration_ms: 500000,
          approval_required: false,
          approval_id: null,
        },
      ],
      logs: [],
    },
    {
      id: "run-2",
      project_id: projectId,
      name: "Plan task breakdown",
      description: "Breaking down the project into actionable tasks",
      command: "/plan create task breakdown for MVP",
      status: "needs_approval",
      started_at: new Date(Date.now() - 300000).toISOString(),
      completed_at: null,
      created_at: new Date(Date.now() - 300000).toISOString(),
      steps: [
        {
          id: "step-2-1",
          run_id: "run-2",
          order: 1,
          name: "Query memory",
          tool: "backboard",
          tool_action: "retrieve",
          input: { query: "project requirements" },
          output: { items_found: 4 },
          status: "success",
          error: null,
          started_at: new Date(Date.now() - 300000).toISOString(),
          completed_at: new Date(Date.now() - 280000).toISOString(),
          duration_ms: 20000,
          approval_required: false,
          approval_id: null,
        },
        {
          id: "step-2-2",
          run_id: "run-2",
          order: 2,
          name: "Generate tasks",
          tool: "openclaw",
          tool_action: "plan",
          input: { goal: "MVP task breakdown" },
          output: {
            tasks: [
              { title: "Setup CI/CD pipeline", priority: "P1" },
              { title: "Implement authentication", priority: "P0" },
              { title: "Add error handling", priority: "P2" },
            ],
          },
          status: "needs_approval",
          error: null,
          started_at: new Date(Date.now() - 280000).toISOString(),
          completed_at: null,
          duration_ms: null,
          approval_required: true,
          approval_id: "approval-1",
        },
      ],
      logs: [],
    },
  ];

  const approvals: ApprovalItem[] = [
    {
      id: "approval-1",
      project_id: projectId,
      run_id: "run-2",
      step_id: "step-2-2",
      title: "Create 3 new tasks",
      description: "Agent wants to create tasks based on MVP requirements analysis",
      type: "task_create",
      impacted_objects: [
        { type: "task", id: "new-1", name: "Setup CI/CD pipeline" },
        { type: "task", id: "new-2", name: "Implement authentication" },
        { type: "task", id: "new-3", name: "Add error handling" },
      ],
      diff: {
        before: null,
        after: "1. Setup CI/CD pipeline (P1)\n2. Implement authentication (P0)\n3. Add error handling (P2)",
      },
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date(Date.now() - 280000).toISOString(),
      expires_at: null,
    },
  ];

  const automations: Automation[] = [
    {
      id: "auto-1",
      project_id: projectId,
      name: "Daily Standup Summary",
      description: "Summarize progress and blockers every morning",
      trigger_type: "schedule",
      trigger_config: { schedule: "0 9 * * *" },
      steps: [
        { id: "as-1", order: 1, name: "Fetch recent updates", tool: "backboard", action: "query", config: {} },
        { id: "as-2", order: 2, name: "Generate summary", tool: "openclaw", action: "summarize", config: {} },
      ],
      status: "enabled",
      required_integrations: ["slack"],
      last_run_at: new Date(Date.now() - 86400000).toISOString(),
      last_run_status: "success",
      next_run_at: new Date(Date.now() + 43200000).toISOString(),
      success_rate: 0.95,
      total_runs: 20,
      created_at: now,
      updated_at: now,
    },
    {
      id: "auto-2",
      project_id: projectId,
      name: "PR Review Reminder",
      description: "Remind team about pending PR reviews",
      trigger_type: "event",
      trigger_config: { event: "pr_opened" },
      steps: [
        { id: "as-3", order: 1, name: "Check PR status", tool: "github", action: "get_pr", config: {} },
        { id: "as-4", order: 2, name: "Notify reviewers", tool: "slack", action: "send_dm", config: {} },
      ],
      status: "enabled",
      required_integrations: ["github", "slack"],
      last_run_at: new Date(Date.now() - 172800000).toISOString(),
      last_run_status: "success",
      next_run_at: null,
      success_rate: 1.0,
      total_runs: 5,
      created_at: now,
      updated_at: now,
    },
  ];

  const integrations: IntegrationConnection[] = [
    {
      id: "int-1",
      project_id: projectId,
      provider: "github",
      name: "GitHub",
      status: "connected",
      permissions: ["repo:read", "repo:write", "issues:read"],
      last_sync_at: new Date(Date.now() - 600000).toISOString(),
      config: { org: "momentum", repo: "dashboard" },
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-2",
      project_id: projectId,
      provider: "slack",
      name: "Slack",
      status: "connected",
      permissions: ["chat:write", "users:read"],
      last_sync_at: new Date(Date.now() - 3600000).toISOString(),
      config: { channel: "#momentum-dev" },
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-3",
      project_id: projectId,
      provider: "notion",
      name: "Notion",
      status: "disconnected",
      permissions: [],
      last_sync_at: null,
      config: {},
      created_at: now,
      updated_at: now,
    },
  ];

  return {
    currentProjectId: projectId,
    projects: [project],
    tasks,
    runs,
    approvals,
    memory,
    automations,
    integrations,
  };
}

// ============ Context ============
interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Computed values
  currentProject: Project | null;
  projectTasks: Task[];
  projectRuns: Run[];
  projectApprovals: ApprovalItem[];
  projectMemory: MemoryItem[];
  projectAutomations: Automation[];
  projectIntegrations: IntegrationConnection[];
  pendingApprovals: ApprovalItem[];
  runningRuns: Run[];
  // Helpers
  createRun: (command: string, name?: string) => Run;
  createTask: (task: Partial<Task>) => Task;
  createMemory: (content: string, category: MemoryCategory) => MemoryItem;
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ============ Provider ============
export function LocalStoreProvider({ children, projectId }: { children: ReactNode; projectId: string }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `momentum-${projectId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: "INIT", payload: { ...parsed, currentProjectId: projectId } });
      } catch {
        // If parsing fails, use seed data
        const seed = createSeedData(projectId);
        dispatch({ type: "INIT", payload: seed });
      }
    } else {
      // No stored data, use seed data
      const seed = createSeedData(projectId);
      dispatch({ type: "INIT", payload: seed });
    }
  }, [projectId]);

  // Save to localStorage on state change
  useEffect(() => {
    if (!state.initialized) return;

    const storageKey = `momentum-${projectId}`;
    const toStore = {
      projects: state.projects,
      tasks: state.tasks,
      runs: state.runs,
      approvals: state.approvals,
      memory: state.memory,
      automations: state.automations,
      integrations: state.integrations,
      sidebarCollapsed: state.sidebarCollapsed,
    };
    localStorage.setItem(storageKey, JSON.stringify(toStore));
  }, [state, projectId]);

  // Computed values
  const currentProject = state.projects.find((p) => p.id === state.currentProjectId) || null;
  const projectTasks = state.tasks.filter((t) => t.project_id === state.currentProjectId);
  const projectRuns = state.runs.filter((r) => r.project_id === state.currentProjectId);
  const projectApprovals = state.approvals.filter((a) => a.project_id === state.currentProjectId);
  const projectMemory = state.memory.filter((m) => m.project_id === state.currentProjectId);
  const projectAutomations = state.automations.filter((a) => a.project_id === state.currentProjectId);
  const projectIntegrations = state.integrations.filter((i) => i.project_id === state.currentProjectId);
  const pendingApprovals = projectApprovals.filter((a) => a.status === "pending");
  const runningRuns = projectRuns.filter((r) => r.status === "running");

  // Helper functions
  const createRun = useCallback(
    (command: string, name?: string): Run => {
      const now = new Date().toISOString();
      const runId = `run-${Date.now()}`;
      const stepId = `step-${Date.now()}`;

      const run: Run = {
        id: runId,
        project_id: projectId,
        name: name || command.slice(0, 50),
        description: command,
        command,
        status: "running",
        started_at: now,
        completed_at: null,
        created_at: now,
        steps: [
          {
            id: stepId,
            run_id: runId,
            order: 1,
            name: "Processing command",
            tool: "internal",
            tool_action: "parse",
            input: { command },
            output: null,
            status: "running",
            error: null,
            started_at: now,
            completed_at: null,
            duration_ms: null,
            approval_required: false,
            approval_id: null,
          },
        ],
        logs: [],
      };

      dispatch({ type: "ADD_RUN", payload: run });
      dispatch({
        type: "SET_AGENT_STATUS",
        payload: { state: "running", message: run.name, current_run_id: run.id },
      });

      // Simulate completion after a delay
      setTimeout(() => {
        const completedStep: RunStep = {
          ...run.steps[0],
          status: "success",
          output: { processed: true },
          completed_at: new Date().toISOString(),
          duration_ms: 2000,
        };
        dispatch({ type: "UPDATE_RUN_STEP", payload: { runId, step: completedStep } });
        dispatch({
          type: "UPDATE_RUN",
          payload: { ...run, status: "success", completed_at: new Date().toISOString(), steps: [completedStep] },
        });
        dispatch({
          type: "SET_AGENT_STATUS",
          payload: { state: "ready", message: null, current_run_id: null },
        });
      }, 2000);

      return run;
    },
    [projectId]
  );

  const createTask = useCallback(
    (taskData: Partial<Task>): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        id: `task-${Date.now()}`,
        project_id: projectId,
        title: taskData.title || "New Task",
        description: taskData.description || null,
        priority: taskData.priority || null,
        owner: taskData.owner || null,
        owner_type: taskData.owner_type || "human",
        due: taskData.due || null,
        status: taskData.status || "todo",
        stage: taskData.stage || "proposed",
        blocked: false,
        blocker_reason: null,
        acceptance_criteria: taskData.acceptance_criteria || [],
        parent_task_id: taskData.parent_task_id || null,
        created_by: taskData.created_by || "human",
        created_at: now,
        updated_at: now,
      };
      dispatch({ type: "ADD_TASK", payload: task });
      return task;
    },
    [projectId]
  );

  const createMemory = useCallback(
    (content: string, category: MemoryCategory): MemoryItem => {
      const now = new Date().toISOString();
      const mem: MemoryItem = {
        id: `mem-${Date.now()}`,
        project_id: projectId,
        category,
        content,
        source: "user",
        pinned: false,
        in_working_set: false,
        created_at: now,
        updated_at: now,
      };
      dispatch({ type: "ADD_MEMORY", payload: mem });
      return mem;
    },
    [projectId]
  );

  const approveItem = useCallback(
    (id: string) => {
      const approval = state.approvals.find((a) => a.id === id);
      if (!approval) return;

      const now = new Date().toISOString();
      const updated: ApprovalItem = {
        ...approval,
        status: "approved",
        reviewed_by: "You",
        reviewed_at: now,
      };
      dispatch({ type: "UPDATE_APPROVAL", payload: updated });

      // Update the run step
      const run = state.runs.find((r) => r.id === approval.run_id);
      if (run) {
        const step = run.steps.find((s) => s.id === approval.step_id);
        if (step) {
          dispatch({
            type: "UPDATE_RUN_STEP",
            payload: { runId: run.id, step: { ...step, status: "success", completed_at: now } },
          });
        }
        // Check if all steps are done
        const allDone = run.steps.every((s) => s.id === approval.step_id || s.status === "success");
        if (allDone) {
          dispatch({ type: "UPDATE_RUN", payload: { ...run, status: "success", completed_at: now } });
          dispatch({ type: "SET_AGENT_STATUS", payload: { state: "ready", message: null, current_run_id: null } });
        }
      }
    },
    [state.approvals, state.runs]
  );

  const rejectItem = useCallback(
    (id: string) => {
      const approval = state.approvals.find((a) => a.id === id);
      if (!approval) return;

      const now = new Date().toISOString();
      dispatch({
        type: "UPDATE_APPROVAL",
        payload: { ...approval, status: "rejected", reviewed_by: "You", reviewed_at: now },
      });

      // Update run to failed
      const run = state.runs.find((r) => r.id === approval.run_id);
      if (run) {
        dispatch({ type: "UPDATE_RUN", payload: { ...run, status: "failed", completed_at: now } });
        dispatch({ type: "SET_AGENT_STATUS", payload: { state: "ready", message: null, current_run_id: null } });
      }
    },
    [state.approvals, state.runs]
  );

  const value: StoreContextValue = {
    state,
    dispatch,
    currentProject,
    projectTasks,
    projectRuns,
    projectApprovals,
    projectMemory,
    projectAutomations,
    projectIntegrations,
    pendingApprovals,
    runningRuns,
    createRun,
    createTask,
    createMemory,
    approveItem,
    rejectItem,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLocalStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useLocalStore must be used within a LocalStoreProvider");
  }
  return context;
}
