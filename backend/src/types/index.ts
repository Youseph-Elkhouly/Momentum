/**
 * Core types for the Momentum Agentic Platform
 */

// ============ Projects ============
export interface Project {
  id: string;
  name: string;
  goal: string | null;
  deadline: string | null;
  repo_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Tasks ============
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskStage = "proposed" | "approved" | "executing" | "completed" | "rejected";
export type TaskOwnerType = "human" | "agent";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  owner: string | null;
  owner_type: TaskOwnerType;
  due: string | null;
  status: TaskStatus;
  stage: TaskStage;
  blocked: boolean;
  blocker_reason: string | null;
  acceptance_criteria: string[];
  parent_task_id: string | null;
  created_by: "human" | "agent";
  created_at: string;
  updated_at: string;
}

// ============ Runs ============
export type RunStatus = "pending" | "running" | "success" | "failed" | "needs_approval" | "cancelled";

export interface Run {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  command: string | null;
  status: RunStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  steps: RunStep[];
  logs: RunLog[];
}

export type RunStepStatus = "pending" | "running" | "success" | "failed" | "needs_approval" | "skipped";

export interface RunStep {
  id: string;
  run_id: string;
  order: number;
  name: string;
  tool: "backboard" | "openclaw" | "internal";
  tool_action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: RunStepStatus;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  approval_required: boolean;
  approval_id: string | null;
}

export interface RunLog {
  id: string;
  run_id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata: Record<string, unknown> | null;
}

// ============ Approvals ============
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalItem {
  id: string;
  project_id: string;
  run_id: string;
  step_id: string;
  title: string;
  description: string;
  type: "task_create" | "task_update" | "memory_update" | "integration_action" | "other";
  impacted_objects: {
    type: "task" | "memory" | "integration";
    id: string;
    name: string;
  }[];
  diff: {
    before: string | null;
    after: string;
  } | null;
  status: ApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  expires_at: string | null;
}

// ============ Memory ============
export type MemoryCategory = "fact" | "decision" | "preference" | "risk" | "link" | "note";

export interface MemoryItem {
  id: string;
  project_id: string;
  category: MemoryCategory;
  content: string;
  source: string | null;
  pinned: boolean;
  in_working_set: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Automations ============
export type AutomationTrigger = "schedule" | "event" | "manual";
export type AutomationStatus = "enabled" | "disabled" | "error";

export interface Automation {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  trigger_type: AutomationTrigger;
  trigger_config: {
    schedule?: string;
    event?: string;
  };
  steps: AutomationStep[];
  status: AutomationStatus;
  required_integrations: string[];
  last_run_at: string | null;
  last_run_status: RunStatus | null;
  next_run_at: string | null;
  success_rate: number;
  total_runs: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationStep {
  id: string;
  order: number;
  name: string;
  tool: string;
  action: string;
  config: Record<string, unknown>;
}

// ============ Integrations ============
export type IntegrationStatus = "connected" | "disconnected" | "error";
export type IntegrationProvider = "github" | "notion" | "slack" | "google_drive" | "linear" | "jira";

export interface IntegrationConnection {
  id: string;
  project_id: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  permissions: string[];
  last_sync_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============ Agent Status ============
export interface AgentStatus {
  state: "ready" | "running" | "needs_approval" | "error";
  message: string | null;
  current_run_id: string | null;
}
