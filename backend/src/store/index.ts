import { v4 as uuid } from "uuid";
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
} from "../types";

// In-memory store
class Store {
  projects: Map<string, Project> = new Map();
  tasks: Map<string, Task> = new Map();
  runs: Map<string, Run> = new Map();
  approvals: Map<string, ApprovalItem> = new Map();
  memory: Map<string, MemoryItem> = new Map();
  automations: Map<string, Automation> = new Map();
  integrations: Map<string, IntegrationConnection> = new Map();
  agentStatus: Map<string, AgentStatus> = new Map(); // keyed by project_id

  constructor() {
    this.seedData();
  }

  private seedData() {
    const projectId = "proj-default";
    const now = new Date().toISOString();

    // Seed project
    const project: Project = {
      id: projectId,
      name: "Momentum MVP",
      goal: "Ship a minimal AI-powered project dashboard",
      deadline: "2026-03-30",
      repo_url: "https://github.com/momentum/dashboard",
      created_at: now,
      updated_at: now,
    };
    this.projects.set(project.id, project);

    // Seed tasks
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
    tasks.forEach((t) => this.tasks.set(t.id, t));

    // Seed memory
    const memoryItems: MemoryItem[] = [
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
    memoryItems.forEach((m) => this.memory.set(m.id, m));

    // Seed runs
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
    runs.forEach((r) => this.runs.set(r.id, r));

    // Seed approvals
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
    approvals.forEach((a) => this.approvals.set(a.id, a));

    // Seed automations
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
    automations.forEach((a) => this.automations.set(a.id, a));

    // Seed integrations
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
    integrations.forEach((i) => this.integrations.set(i.id, i));

    // Set agent status
    this.agentStatus.set(projectId, {
      state: "needs_approval",
      message: "Waiting for approval on task creation",
      current_run_id: "run-2",
    });
  }

  // Helper methods
  getByProjectId<T extends { project_id: string }>(map: Map<string, T>, projectId: string): T[] {
    return Array.from(map.values()).filter((item) => item.project_id === projectId);
  }
}

export const store = new Store();
