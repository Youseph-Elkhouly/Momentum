/**
 * In-memory mock data store
 * Persists during dev session, resets on server restart
 */

import type {
  Project,
  Task,
  Run,
  RunStep,
  ApprovalItem,
  MemoryItem,
  Automation,
  IntegrationConnection,
  CommandSuggestion,
} from "./types";

// ============ Data Store ============
class MockStore {
  projects: Map<string, Project> = new Map();
  tasks: Map<string, Task> = new Map();
  runs: Map<string, Run> = new Map();
  approvals: Map<string, ApprovalItem> = new Map();
  memory: Map<string, MemoryItem> = new Map();
  automations: Map<string, Automation> = new Map();
  integrations: Map<string, IntegrationConnection> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date().toISOString();
    const projectId = "proj-demo";

    // Project
    this.projects.set(projectId, {
      id: projectId,
      name: "Momentum MVP",
      goal: "Ship a minimal AI-powered project dashboard",
      deadline: "2026-03-30",
      repo_url: "https://github.com/momentum/dashboard",
      created_at: now,
      updated_at: now,
    });

    // Tasks
    const seedTasks: Omit<Task, "created_at" | "updated_at">[] = [
      {
        id: "t1",
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
      },
      {
        id: "t2",
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
      },
      {
        id: "t3",
        project_id: projectId,
        title: "Build dashboard UI",
        description: "Next.js + Tailwind implementation",
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
      },
      {
        id: "t4",
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
      },
      {
        id: "t5",
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
      },
    ];

    for (const task of seedTasks) {
      this.tasks.set(task.id, { ...task, created_at: now, updated_at: now });
    }

    // Memory
    const seedMemory: Omit<MemoryItem, "created_at" | "updated_at">[] = [
      {
        id: "m1",
        project_id: projectId,
        category: "decision",
        content: "Use Next.js App Router and Tailwind only; no component libraries.",
        source: "Team meeting",
        pinned: true,
        in_working_set: true,
      },
      {
        id: "m2",
        project_id: projectId,
        category: "preference",
        content: "Monochrome UI; documentation-first tone.",
        source: "Design review",
        pinned: false,
        in_working_set: true,
      },
      {
        id: "m3",
        project_id: projectId,
        category: "risk",
        content: "Scope creep on first release — keep MVP tight.",
        source: "Planning session",
        pinned: true,
        in_working_set: false,
      },
      {
        id: "m4",
        project_id: projectId,
        category: "fact",
        content: "Momentum MVP: minimal dashboard with Gemini plans, Backboard memory, OpenClaw automations.",
        source: "PRD",
        pinned: false,
        in_working_set: true,
      },
      {
        id: "m5",
        project_id: projectId,
        category: "link",
        content: "https://github.com/momentum/dashboard - Main repository",
        source: null,
        pinned: false,
        in_working_set: false,
      },
    ];

    for (const mem of seedMemory) {
      this.memory.set(mem.id, { ...mem, created_at: now, updated_at: now });
    }

    // Automations
    const seedAutomations: Omit<Automation, "created_at" | "updated_at">[] = [
      {
        id: "auto1",
        project_id: projectId,
        name: "Daily Standup Summary",
        description: "Summarize progress and blockers every morning",
        trigger_type: "schedule",
        trigger_config: { schedule: "0 9 * * *" },
        steps: [
          { id: "s1", order: 1, name: "Fetch recent updates", tool: "backboard", action: "query_memory", config: {} },
          { id: "s2", order: 2, name: "Generate summary", tool: "openclaw", action: "summarize", config: {} },
          { id: "s3", order: 3, name: "Post to Slack", tool: "slack", action: "send_message", config: {} },
        ],
        status: "enabled",
        required_integrations: ["slack"],
        last_run_at: "2026-02-15T09:00:00Z",
        last_run_status: "success",
        next_run_at: "2026-02-16T09:00:00Z",
        success_rate: 0.95,
        total_runs: 20,
      },
      {
        id: "auto2",
        project_id: projectId,
        name: "PR Review Reminder",
        description: "Remind team about pending PR reviews",
        trigger_type: "event",
        trigger_config: { event: "pr_opened" },
        steps: [
          { id: "s1", order: 1, name: "Check PR status", tool: "github", action: "get_pr", config: {} },
          { id: "s2", order: 2, name: "Notify reviewers", tool: "slack", action: "send_dm", config: {} },
        ],
        status: "enabled",
        required_integrations: ["github", "slack"],
        last_run_at: "2026-02-14T14:30:00Z",
        last_run_status: "success",
        next_run_at: null,
        success_rate: 1.0,
        total_runs: 5,
      },
      {
        id: "auto3",
        project_id: projectId,
        name: "Weekly Progress Report",
        description: "Generate and share weekly progress report",
        trigger_type: "manual",
        trigger_config: {},
        steps: [
          { id: "s1", order: 1, name: "Gather metrics", tool: "internal", action: "collect_metrics", config: {} },
          { id: "s2", order: 2, name: "Generate report", tool: "openclaw", action: "generate_report", config: {} },
          { id: "s3", order: 3, name: "Save to Drive", tool: "google_drive", action: "upload", config: {} },
        ],
        status: "disabled",
        required_integrations: ["google_drive"],
        last_run_at: null,
        last_run_status: null,
        next_run_at: null,
        success_rate: 0,
        total_runs: 0,
      },
    ];

    for (const auto of seedAutomations) {
      this.automations.set(auto.id, { ...auto, created_at: now, updated_at: now });
    }

    // Integrations
    const seedIntegrations: Omit<IntegrationConnection, "created_at" | "updated_at">[] = [
      {
        id: "int1",
        project_id: projectId,
        provider: "github",
        name: "GitHub",
        status: "connected",
        permissions: ["repo:read", "repo:write", "issues:read", "issues:write"],
        last_sync_at: "2026-02-15T10:30:00Z",
        config: { org: "momentum", repo: "dashboard" },
      },
      {
        id: "int2",
        project_id: projectId,
        provider: "slack",
        name: "Slack",
        status: "connected",
        permissions: ["chat:write", "users:read"],
        last_sync_at: "2026-02-15T09:00:00Z",
        config: { channel: "#momentum-dev" },
      },
      {
        id: "int3",
        project_id: projectId,
        provider: "notion",
        name: "Notion",
        status: "disconnected",
        permissions: [],
        last_sync_at: null,
        config: {},
      },
      {
        id: "int4",
        project_id: projectId,
        provider: "google_drive",
        name: "Google Drive",
        status: "disconnected",
        permissions: [],
        last_sync_at: null,
        config: {},
      },
      {
        id: "int5",
        project_id: projectId,
        provider: "linear",
        name: "Linear",
        status: "disconnected",
        permissions: [],
        last_sync_at: null,
        config: {},
      },
    ];

    for (const int of seedIntegrations) {
      this.integrations.set(int.id, { ...int, created_at: now, updated_at: now });
    }
  }

  // Helper to generate IDs
  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Singleton instance
export const mockStore = new MockStore();

// ============ Command Suggestions ============
export const commandSuggestions: CommandSuggestion[] = [
  { id: "c1", command: "/plan", description: "Create a plan from a goal", category: "plan" },
  { id: "c2", command: "/sync tasks to notion", description: "Sync tasks to Notion", category: "sync" },
  { id: "c3", command: "/sync tasks from linear", description: "Import tasks from Linear", category: "sync" },
  { id: "c4", command: "/summarize", description: "Summarize recent activity", category: "summarize" },
  { id: "c5", command: "/generate prd", description: "Generate a PRD document", category: "plan" },
  { id: "c6", command: "/run workflow", description: "Run an automation workflow", category: "run" },
  { id: "c7", command: "/recall", description: "Search project memory", category: "memory" },
  { id: "c8", command: "/remember", description: "Save to project memory", category: "memory" },
  { id: "c9", command: "/break down task", description: "Break a task into subtasks", category: "plan" },
  { id: "c10", command: "/review pr", description: "Review a pull request", category: "other" },
];

// ============ Run Creation Helper ============
export function createMockRun(projectId: string, command: string): { run: Run; approvals: ApprovalItem[] } {
  const now = new Date().toISOString();
  const runId = mockStore.generateId("run");

  // Parse command to determine run type
  const isPlanning = command.toLowerCase().includes("plan") || command.toLowerCase().includes("generate");
  const needsApproval = isPlanning; // Planning runs need approval

  const steps: RunStep[] = [
    {
      id: mockStore.generateId("step"),
      run_id: runId,
      order: 1,
      name: "Analyze request",
      tool: "internal",
      tool_action: "parse_command",
      input: { command },
      output: { parsed: true, intent: isPlanning ? "plan" : "execute" },
      status: "success",
      error: null,
      started_at: now,
      completed_at: now,
      duration_ms: 150,
      approval_required: false,
      approval_id: null,
    },
    {
      id: mockStore.generateId("step"),
      run_id: runId,
      order: 2,
      name: "Query project memory",
      tool: "backboard",
      tool_action: "retrieve_context",
      input: { project_id: projectId },
      output: { items_found: 5 },
      status: "success",
      error: null,
      started_at: now,
      completed_at: now,
      duration_ms: 200,
      approval_required: false,
      approval_id: null,
    },
  ];

  const approvals: ApprovalItem[] = [];

  if (isPlanning) {
    const approvalId = mockStore.generateId("appr");
    const stepId = mockStore.generateId("step");

    steps.push({
      id: stepId,
      run_id: runId,
      order: 3,
      name: "Generate plan",
      tool: "openclaw",
      tool_action: "generate_plan",
      input: { goal: command },
      output: {
        tasks: [
          { title: "Research requirements", priority: "P1" },
          { title: "Create wireframes", priority: "P2" },
          { title: "Implement prototype", priority: "P1" },
        ],
      },
      status: "needs_approval",
      error: null,
      started_at: now,
      completed_at: null,
      duration_ms: null,
      approval_required: true,
      approval_id: approvalId,
    });

    approvals.push({
      id: approvalId,
      project_id: projectId,
      run_id: runId,
      step_id: stepId,
      title: "Approve generated plan",
      description: `The agent has generated a plan based on: "${command}"`,
      type: "task_create",
      impacted_objects: [
        { type: "task", id: "new-1", name: "Research requirements" },
        { type: "task", id: "new-2", name: "Create wireframes" },
        { type: "task", id: "new-3", name: "Implement prototype" },
      ],
      diff: {
        before: null,
        after: `Tasks to be created:\n1. Research requirements (P1)\n2. Create wireframes (P2)\n3. Implement prototype (P1)`,
      },
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      created_at: now,
      expires_at: null,
    });
  } else {
    steps.push({
      id: mockStore.generateId("step"),
      run_id: runId,
      order: 3,
      name: "Execute action",
      tool: "openclaw",
      tool_action: "execute",
      input: { command },
      output: { success: true },
      status: "success",
      error: null,
      started_at: now,
      completed_at: now,
      duration_ms: 500,
      approval_required: false,
      approval_id: null,
    });
  }

  const run: Run = {
    id: runId,
    project_id: projectId,
    name: command.slice(0, 50) + (command.length > 50 ? "..." : ""),
    description: command,
    command,
    status: needsApproval ? "needs_approval" : "success",
    started_at: now,
    completed_at: needsApproval ? null : now,
    created_at: now,
    steps,
    logs: [
      { id: mockStore.generateId("log"), run_id: runId, timestamp: now, level: "info", message: "Run started", metadata: null },
      { id: mockStore.generateId("log"), run_id: runId, timestamp: now, level: "info", message: "Analyzing request...", metadata: null },
      { id: mockStore.generateId("log"), run_id: runId, timestamp: now, level: "info", message: "Querying project memory...", metadata: null },
      ...(needsApproval
        ? [{ id: mockStore.generateId("log"), run_id: runId, timestamp: now, level: "info" as const, message: "Waiting for approval...", metadata: null }]
        : [{ id: mockStore.generateId("log"), run_id: runId, timestamp: now, level: "info" as const, message: "Run completed successfully", metadata: null }]),
    ],
  };

  return { run, approvals };
}
