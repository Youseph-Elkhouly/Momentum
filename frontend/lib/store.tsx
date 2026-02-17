"use client";

import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type {
  Project,
  Task,
  Run,
  ApprovalItem,
  MemoryItem,
  Automation,
  IntegrationConnection,
  AgentStatus,
} from "./types";

// ============ State Types ============
interface AppState {
  // Current project
  currentProject: Project | null;

  // Entities (normalized by id)
  tasks: Record<string, Task>;
  runs: Record<string, Run>;
  approvals: Record<string, ApprovalItem>;
  memory: Record<string, MemoryItem>;
  automations: Record<string, Automation>;
  integrations: Record<string, IntegrationConnection>;

  // UI State
  agentStatus: AgentStatus;
  commandBarOpen: boolean;
  activeNav: string;

  // Loading states
  loading: {
    tasks: boolean;
    runs: boolean;
    approvals: boolean;
    memory: boolean;
    automations: boolean;
    integrations: boolean;
  };
}

// ============ Actions ============
type Action =
  | { type: "SET_PROJECT"; payload: Project | null }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "SET_RUNS"; payload: Run[] }
  | { type: "UPDATE_RUN"; payload: Run }
  | { type: "ADD_RUN"; payload: Run }
  | { type: "SET_APPROVALS"; payload: ApprovalItem[] }
  | { type: "ADD_APPROVAL"; payload: ApprovalItem }
  | { type: "UPDATE_APPROVAL"; payload: ApprovalItem }
  | { type: "REMOVE_APPROVAL"; payload: string }
  | { type: "SET_MEMORY"; payload: MemoryItem[] }
  | { type: "UPDATE_MEMORY"; payload: MemoryItem }
  | { type: "ADD_MEMORY"; payload: MemoryItem }
  | { type: "DELETE_MEMORY"; payload: string }
  | { type: "SET_AUTOMATIONS"; payload: Automation[] }
  | { type: "UPDATE_AUTOMATION"; payload: Automation }
  | { type: "SET_INTEGRATIONS"; payload: IntegrationConnection[] }
  | { type: "ADD_INTEGRATION"; payload: IntegrationConnection }
  | { type: "UPDATE_INTEGRATION"; payload: IntegrationConnection }
  | { type: "DELETE_INTEGRATION"; payload: string }
  | { type: "SET_AGENT_STATUS"; payload: AgentStatus }
  | { type: "SET_COMMAND_BAR_OPEN"; payload: boolean }
  | { type: "SET_ACTIVE_NAV"; payload: string }
  | { type: "SET_LOADING"; payload: { key: keyof AppState["loading"]; value: boolean } };

// ============ Initial State ============
const initialState: AppState = {
  currentProject: null,
  tasks: {},
  runs: {},
  approvals: {},
  memory: {},
  automations: {},
  integrations: {},
  agentStatus: { state: "ready", message: null, current_run_id: null },
  commandBarOpen: false,
  activeNav: "overview",
  loading: {
    tasks: false,
    runs: false,
    approvals: false,
    memory: false,
    automations: false,
    integrations: false,
  },
};

// ============ Reducer ============
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PROJECT":
      return { ...state, currentProject: action.payload };

    case "SET_TASKS":
      return {
        ...state,
        tasks: action.payload.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
      };

    case "UPDATE_TASK":
    case "ADD_TASK":
      return {
        ...state,
        tasks: { ...state.tasks, [action.payload.id]: action.payload },
      };

    case "DELETE_TASK": {
      const { [action.payload]: _, ...rest } = state.tasks;
      return { ...state, tasks: rest };
    }

    case "SET_RUNS":
      return {
        ...state,
        runs: action.payload.reduce((acc, r) => ({ ...acc, [r.id]: r }), {}),
      };

    case "UPDATE_RUN":
    case "ADD_RUN":
      return {
        ...state,
        runs: { ...state.runs, [action.payload.id]: action.payload },
      };

    case "SET_APPROVALS":
      return {
        ...state,
        approvals: action.payload.reduce((acc, a) => ({ ...acc, [a.id]: a }), {}),
      };

    case "ADD_APPROVAL":
      return {
        ...state,
        approvals: { ...state.approvals, [action.payload.id]: action.payload },
      };

    case "UPDATE_APPROVAL":
      return {
        ...state,
        approvals: { ...state.approvals, [action.payload.id]: action.payload },
      };

    case "REMOVE_APPROVAL": {
      const { [action.payload]: _, ...rest } = state.approvals;
      return { ...state, approvals: rest };
    }

    case "SET_MEMORY":
      return {
        ...state,
        memory: action.payload.reduce((acc, m) => ({ ...acc, [m.id]: m }), {}),
      };

    case "UPDATE_MEMORY":
    case "ADD_MEMORY":
      return {
        ...state,
        memory: { ...state.memory, [action.payload.id]: action.payload },
      };

    case "DELETE_MEMORY": {
      const { [action.payload]: _, ...rest } = state.memory;
      return { ...state, memory: rest };
    }

    case "SET_AUTOMATIONS":
      return {
        ...state,
        automations: action.payload.reduce((acc, a) => ({ ...acc, [a.id]: a }), {}),
      };

    case "UPDATE_AUTOMATION":
      return {
        ...state,
        automations: { ...state.automations, [action.payload.id]: action.payload },
      };

    case "SET_INTEGRATIONS":
      return {
        ...state,
        integrations: action.payload.reduce((acc, i) => ({ ...acc, [i.id]: i }), {}),
      };

    case "ADD_INTEGRATION":
    case "UPDATE_INTEGRATION":
      return {
        ...state,
        integrations: { ...state.integrations, [action.payload.id]: action.payload },
      };

    case "DELETE_INTEGRATION": {
      const { [action.payload]: _, ...rest } = state.integrations;
      return { ...state, integrations: rest };
    }

    case "SET_AGENT_STATUS":
      return { ...state, agentStatus: action.payload };

    case "SET_COMMAND_BAR_OPEN":
      return { ...state, commandBarOpen: action.payload };

    case "SET_ACTIVE_NAV":
      return { ...state, activeNav: action.payload };

    case "SET_LOADING":
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value },
      };

    default:
      return state;
  }
}

// ============ Context ============
interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;

  // Selectors
  tasksList: Task[];
  tasksByStatus: { todo: Task[]; doing: Task[]; done: Task[] };
  tasksByStage: { proposed: Task[]; approved: Task[]; executing: Task[]; completed: Task[]; rejected: Task[] };
  runsList: Run[];
  approvalsList: ApprovalItem[];
  memoryList: MemoryItem[];
  memoryByCategory: Record<string, MemoryItem[]>;
  workingSet: MemoryItem[];
  automationsList: Automation[];
  integrationsList: IntegrationConnection[];
  pendingApprovalCount: number;

  // Actions
  setProject: (project: Project | null) => void;
  fetchTasks: () => Promise<void>;
  updateTask: (task: Task) => void;
  fetchRuns: () => Promise<void>;
  createRun: (command: string) => Promise<Run | null>;
  fetchApprovals: () => Promise<void>;
  approveItem: (id: string) => Promise<void>;
  rejectItem: (id: string) => Promise<void>;
  fetchMemory: () => Promise<void>;
  updateMemoryItem: (item: MemoryItem) => void;
  addMemoryItem: (item: Omit<MemoryItem, "id" | "created_at" | "updated_at">) => Promise<MemoryItem | null>;
  deleteMemoryItem: (id: string) => Promise<void>;
  toggleCommandBar: () => void;
  setActiveNav: (nav: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ============ Provider ============
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Selectors
  const tasksList = Object.values(state.tasks);
  const tasksByStatus = {
    todo: tasksList.filter((t) => t.status === "todo"),
    doing: tasksList.filter((t) => t.status === "doing"),
    done: tasksList.filter((t) => t.status === "done"),
  };
  const tasksByStage = {
    proposed: tasksList.filter((t) => t.stage === "proposed"),
    approved: tasksList.filter((t) => t.stage === "approved"),
    executing: tasksList.filter((t) => t.stage === "executing"),
    completed: tasksList.filter((t) => t.stage === "completed"),
    rejected: tasksList.filter((t) => t.stage === "rejected"),
  };
  const runsList = Object.values(state.runs).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const approvalsList = Object.values(state.approvals).filter((a) => a.status === "pending");
  const memoryList = Object.values(state.memory);
  const memoryByCategory = memoryList.reduce(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<string, MemoryItem[]>
  );
  const workingSet = memoryList.filter((m) => m.in_working_set);
  const automationsList = Object.values(state.automations);
  const integrationsList = Object.values(state.integrations);
  const pendingApprovalCount = approvalsList.length;

  // Actions
  const setProject = useCallback((project: Project | null) => {
    dispatch({ type: "SET_PROJECT", payload: project });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!state.currentProject) return;
    dispatch({ type: "SET_LOADING", payload: { key: "tasks", value: true } });
    try {
      const res = await fetch(`/api/projects/${state.currentProject.id}/tasks`);
      const data = await res.json();
      if (data.tasks) dispatch({ type: "SET_TASKS", payload: data.tasks });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "tasks", value: false } });
    }
  }, [state.currentProject]);

  const updateTask = useCallback((task: Task) => {
    dispatch({ type: "UPDATE_TASK", payload: task });
  }, []);

  const fetchRuns = useCallback(async () => {
    if (!state.currentProject) return;
    dispatch({ type: "SET_LOADING", payload: { key: "runs", value: true } });
    try {
      const res = await fetch(`/api/projects/${state.currentProject.id}/runs`);
      const data = await res.json();
      if (data.runs) dispatch({ type: "SET_RUNS", payload: data.runs });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "runs", value: false } });
    }
  }, [state.currentProject]);

  const createRun = useCallback(
    async (command: string): Promise<Run | null> => {
      if (!state.currentProject) return null;
      dispatch({ type: "SET_AGENT_STATUS", payload: { state: "running", message: "Starting run...", current_run_id: null } });
      try {
        const res = await fetch(`/api/projects/${state.currentProject.id}/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        const data = await res.json();
        if (data.run) {
          dispatch({ type: "ADD_RUN", payload: data.run });
          dispatch({
            type: "SET_AGENT_STATUS",
            payload: {
              state: data.run.status === "needs_approval" ? "needs_approval" : "running",
              message: data.run.name,
              current_run_id: data.run.id,
            },
          });
          // Check for approvals
          if (data.approvals) {
            dispatch({ type: "SET_APPROVALS", payload: data.approvals });
          }
          return data.run;
        }
      } catch (e) {
        dispatch({ type: "SET_AGENT_STATUS", payload: { state: "error", message: "Failed to create run", current_run_id: null } });
      }
      return null;
    },
    [state.currentProject]
  );

  const fetchApprovals = useCallback(async () => {
    if (!state.currentProject) return;
    dispatch({ type: "SET_LOADING", payload: { key: "approvals", value: true } });
    try {
      const res = await fetch(`/api/projects/${state.currentProject.id}/approvals`);
      const data = await res.json();
      if (data.approvals) dispatch({ type: "SET_APPROVALS", payload: data.approvals });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "approvals", value: false } });
    }
  }, [state.currentProject]);

  const approveItem = useCallback(
    async (id: string) => {
      if (!state.currentProject) return;
      const res = await fetch(`/api/projects/${state.currentProject.id}/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.approval) {
        dispatch({ type: "UPDATE_APPROVAL", payload: data.approval });
      }
      if (data.run) {
        dispatch({ type: "UPDATE_RUN", payload: data.run });
      }
    },
    [state.currentProject]
  );

  const rejectItem = useCallback(
    async (id: string) => {
      if (!state.currentProject) return;
      const res = await fetch(`/api/projects/${state.currentProject.id}/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (data.approval) {
        dispatch({ type: "UPDATE_APPROVAL", payload: data.approval });
      }
    },
    [state.currentProject]
  );

  const fetchMemory = useCallback(async () => {
    if (!state.currentProject) return;
    dispatch({ type: "SET_LOADING", payload: { key: "memory", value: true } });
    try {
      const res = await fetch(`/api/projects/${state.currentProject.id}/memory`);
      const data = await res.json();
      if (data.memory) dispatch({ type: "SET_MEMORY", payload: data.memory });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "memory", value: false } });
    }
  }, [state.currentProject]);

  const updateMemoryItem = useCallback((item: MemoryItem) => {
    dispatch({ type: "UPDATE_MEMORY", payload: item });
    // Persist to API
    if (state.currentProject) {
      fetch(`/api/projects/${state.currentProject.id}/memory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
  }, [state.currentProject]);

  const addMemoryItem = useCallback(
    async (item: Omit<MemoryItem, "id" | "created_at" | "updated_at">): Promise<MemoryItem | null> => {
      if (!state.currentProject) return null;
      const res = await fetch(`/api/projects/${state.currentProject.id}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.memory) {
        dispatch({ type: "ADD_MEMORY", payload: data.memory });
        return data.memory;
      }
      return null;
    },
    [state.currentProject]
  );

  const deleteMemoryItem = useCallback(
    async (id: string) => {
      if (!state.currentProject) return;
      await fetch(`/api/projects/${state.currentProject.id}/memory/${id}`, {
        method: "DELETE",
      });
      dispatch({ type: "DELETE_MEMORY", payload: id });
    },
    [state.currentProject]
  );

  const toggleCommandBar = useCallback(() => {
    dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: !state.commandBarOpen });
  }, [state.commandBarOpen]);

  const setActiveNav = useCallback((nav: string) => {
    dispatch({ type: "SET_ACTIVE_NAV", payload: nav });
  }, []);

  const value: StoreContextValue = {
    state,
    dispatch,
    tasksList,
    tasksByStatus,
    tasksByStage,
    runsList,
    approvalsList,
    memoryList,
    memoryByCategory,
    workingSet,
    automationsList,
    integrationsList,
    pendingApprovalCount,
    setProject,
    fetchTasks,
    updateTask,
    fetchRuns,
    createRun,
    fetchApprovals,
    approveItem,
    rejectItem,
    fetchMemory,
    updateMemoryItem,
    addMemoryItem,
    deleteMemoryItem,
    toggleCommandBar,
    setActiveNav,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
