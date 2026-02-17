/**
 * localStorage wrapper for Memory Graph data
 */

import type { ProjectMemoryGraph, MemoryNode, MemoryEdge, TaskWithMemory, TeamMember } from "../types";

const GRAPH_KEY_PREFIX = "momentum:graph:";
const TASKS_KEY_PREFIX = "momentum:tasks:";
const TEAM_KEY_PREFIX = "momentum:team:";

// ============ Graph Storage ============

export function getGraph(projectId: string): ProjectMemoryGraph {
  if (typeof window === "undefined") return { nodes: [], edges: [] };
  
  const key = GRAPH_KEY_PREFIX + projectId;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return createDefaultGraph(projectId);
    }
  }
  
  return createDefaultGraph(projectId);
}

export function saveGraph(projectId: string, graph: ProjectMemoryGraph): void {
  if (typeof window === "undefined") return;
  
  const key = GRAPH_KEY_PREFIX + projectId;
  localStorage.setItem(key, JSON.stringify(graph));
}

function createDefaultGraph(projectId: string): ProjectMemoryGraph {
  const now = new Date().toISOString();

  // Create realistic development project nodes
  const nodes: MemoryNode[] = [
    // Architecture & Infrastructure
    {
      id: "node_1",
      project_id: projectId,
      title: "Database Schema v2.3",
      content: "PostgreSQL with Prisma ORM. Tables: users, orders, products, payments, subscriptions. Using UUID primary keys and soft deletes.",
      type: "decision",
      tags: ["database", "architecture"],
      pinned: true,
      x: 80,
      y: 80,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_2",
      project_id: projectId,
      title: "Stripe Integration Notes",
      content: "Using Stripe Checkout for payments. Webhooks configured for: checkout.session.completed, invoice.paid, customer.subscription.updated. Test mode keys in .env.local",
      type: "fact",
      tags: ["payments", "stripe", "integration"],
      pinned: true,
      x: 340,
      y: 80,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_3",
      project_id: projectId,
      title: "Auth: NextAuth + Google OAuth",
      content: "Using NextAuth.js with Google and GitHub providers. JWT strategy with 7-day sessions. Role-based access: admin, member, viewer.",
      type: "decision",
      tags: ["auth", "security"],
      pinned: false,
      x: 600,
      y: 80,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    // Risks & Issues
    {
      id: "node_4",
      project_id: projectId,
      title: "N+1 Query in Orders List",
      content: "The /api/orders endpoint has N+1 problem when fetching user data. Need to add Prisma include or use DataLoader. Causing 2s+ response times.",
      type: "risk",
      tags: ["performance", "database", "bug"],
      pinned: false,
      x: 80,
      y: 260,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_5",
      project_id: projectId,
      title: "Rate Limiting Required",
      content: "API endpoints currently have no rate limiting. Risk of abuse on /api/auth and /api/checkout. Consider using upstash/ratelimit or similar.",
      type: "risk",
      tags: ["security", "api"],
      pinned: false,
      x: 340,
      y: 260,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    // Preferences & Standards
    {
      id: "node_6",
      project_id: projectId,
      title: "Code Style Guidelines",
      content: "ESLint + Prettier. Prefer named exports. Use 'use server' for mutations. Keep components under 200 lines. Colocate tests with source files.",
      type: "preference",
      tags: ["standards", "dx"],
      pinned: false,
      x: 600,
      y: 260,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    // Notes & Documentation
    {
      id: "node_7",
      project_id: projectId,
      title: "PR #247 Review Notes",
      content: "Refactors payment processing. Good: extracted PaymentService class. Concern: error handling in webhook handler could miss edge cases. Requested changes on line 142-156.",
      type: "note",
      tags: ["pr-review", "payments"],
      pinned: false,
      x: 80,
      y: 440,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_8",
      project_id: projectId,
      title: "API Versioning Strategy",
      content: "URL-based versioning: /api/v1/*, /api/v2/*. Deprecation policy: 6 months notice, maintain 2 versions. Currently on v1, v2 planned for Q3.",
      type: "decision",
      tags: ["api", "architecture"],
      pinned: false,
      x: 340,
      y: 440,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_9",
      project_id: projectId,
      title: "Deployment Pipeline",
      content: "GitHub Actions → Vercel Preview (PRs) → Vercel Production (main). Database migrations run via prisma migrate deploy. Seed data in staging only.",
      type: "fact",
      tags: ["devops", "ci-cd"],
      pinned: false,
      x: 600,
      y: 440,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    // Links & Resources
    {
      id: "node_10",
      project_id: projectId,
      title: "Stripe Docs: Webhooks",
      content: "https://stripe.com/docs/webhooks - Reference for webhook signature verification and event handling best practices.",
      type: "link",
      tags: ["documentation", "stripe"],
      pinned: false,
      x: 80,
      y: 620,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_11",
      project_id: projectId,
      title: "Figma: Dashboard Designs",
      content: "https://figma.com/file/xxx - Latest mockups for admin dashboard. Last updated Feb 10. Includes mobile responsive views.",
      type: "link",
      tags: ["design", "figma"],
      pinned: false,
      x: 340,
      y: 620,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "node_12",
      project_id: projectId,
      title: "Customer Feedback: Checkout",
      content: "Users report confusion on shipping step. 23% drop-off at address form. Consider: progress indicator, inline validation, save for later.",
      type: "fact",
      tags: ["ux", "feedback", "checkout"],
      pinned: true,
      x: 600,
      y: 620,
      files: [],
      parentId: null,
      collapsed: false,
      created_at: now,
      updated_at: now,
    },
  ];

  const edges: MemoryEdge[] = [
    {
      id: "edge_1",
      project_id: projectId,
      source: "node_1",
      target: "node_4",
      label: "causes",
      created_at: now,
    },
    {
      id: "edge_2",
      project_id: projectId,
      source: "node_2",
      target: "node_7",
      label: "related to",
      created_at: now,
    },
    {
      id: "edge_3",
      project_id: projectId,
      source: "node_2",
      target: "node_10",
      label: "references",
      created_at: now,
    },
    {
      id: "edge_4",
      project_id: projectId,
      source: "node_3",
      target: "node_5",
      label: "requires",
      created_at: now,
    },
    {
      id: "edge_5",
      project_id: projectId,
      source: "node_8",
      target: "node_9",
      label: "deployed via",
      created_at: now,
    },
    {
      id: "edge_6",
      project_id: projectId,
      source: "node_12",
      target: "node_11",
      label: "informs",
      created_at: now,
    },
  ];

  const graph = { nodes, edges };
  saveGraph(projectId, graph);
  return graph;
}

// ============ Node Operations ============

export function addNode(projectId: string, node: Omit<MemoryNode, "id" | "project_id" | "created_at" | "updated_at">): MemoryNode {
  const graph = getGraph(projectId);
  const now = new Date().toISOString();
  
  const newNode: MemoryNode = {
    ...node,
    id: "node_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    project_id: projectId,
    created_at: now,
    updated_at: now,
  };
  
  graph.nodes.push(newNode);
  saveGraph(projectId, graph);
  return newNode;
}

export function updateNode(projectId: string, nodeId: string, updates: Partial<MemoryNode>): MemoryNode | null {
  const graph = getGraph(projectId);
  const index = graph.nodes.findIndex(n => n.id === nodeId);
  
  if (index === -1) return null;
  
  graph.nodes[index] = {
    ...graph.nodes[index],
    ...updates,
    id: nodeId,
    project_id: projectId,
    updated_at: new Date().toISOString(),
  };
  
  saveGraph(projectId, graph);
  return graph.nodes[index];
}

export function deleteNode(projectId: string, nodeId: string): void {
  const graph = getGraph(projectId);
  graph.nodes = graph.nodes.filter(n => n.id !== nodeId);
  graph.edges = graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  saveGraph(projectId, graph);
}

// ============ Edge Operations ============

export function addEdge(projectId: string, source: string, target: string, label: string | null = null): MemoryEdge {
  const graph = getGraph(projectId);
  
  // Prevent duplicate edges
  const exists = graph.edges.some(e => e.source === source && e.target === target);
  if (exists) {
    return graph.edges.find(e => e.source === source && e.target === target)!;
  }
  
  const newEdge: MemoryEdge = {
    id: "edge_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    project_id: projectId,
    source,
    target,
    label,
    created_at: new Date().toISOString(),
  };
  
  graph.edges.push(newEdge);
  saveGraph(projectId, graph);
  return newEdge;
}

export function updateEdge(projectId: string, edgeId: string, updates: Partial<MemoryEdge>): MemoryEdge | null {
  const graph = getGraph(projectId);
  const index = graph.edges.findIndex(e => e.id === edgeId);
  
  if (index === -1) return null;
  
  graph.edges[index] = {
    ...graph.edges[index],
    ...updates,
    id: edgeId,
    project_id: projectId,
  };
  
  saveGraph(projectId, graph);
  return graph.edges[index];
}

export function deleteEdge(projectId: string, edgeId: string): void {
  const graph = getGraph(projectId);
  graph.edges = graph.edges.filter(e => e.id !== edgeId);
  saveGraph(projectId, graph);
}

// ============ Tasks with Memory Storage ============

export function getTasks(projectId: string): TaskWithMemory[] {
  if (typeof window === "undefined") return [];
  
  const key = TASKS_KEY_PREFIX + projectId;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  return createDefaultTasks(projectId);
}

export function saveTasks(projectId: string, tasks: TaskWithMemory[]): void {
  if (typeof window === "undefined") return;
  
  const key = TASKS_KEY_PREFIX + projectId;
  localStorage.setItem(key, JSON.stringify(tasks));
}

function createDefaultTasks(projectId: string): TaskWithMemory[] {
  const now = new Date().toISOString();

  const tasks: TaskWithMemory[] = [
    // In Progress Tasks
    {
      id: "task_1",
      project_id: projectId,
      title: "Review PR #247: Payment service refactor",
      description: "Review the PaymentService extraction PR. Check error handling in webhook handler, verify Stripe event coverage, ensure idempotency keys are used correctly.",
      priority: "P0",
      owner: "Agent",
      owner_type: "agent",
      due: "2026-02-16",
      status: "doing",
      stage: "executing",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["Error handling reviewed", "Webhook events verified", "Security implications checked"],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_2", "node_7"],
    },
    {
      id: "task_2",
      project_id: projectId,
      title: "Fix N+1 query in orders endpoint",
      description: "Optimize /api/orders to use Prisma includes for user and product data. Target response time: <200ms for 100 orders.",
      priority: "P0",
      owner: "Sarah",
      owner_type: "human",
      due: "2026-02-17",
      status: "doing",
      stage: "executing",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["Response time < 200ms", "No N+1 queries in logs", "Load test passing"],
      parent_task_id: null,
      created_by: "agent",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_1", "node_4"],
    },
    {
      id: "task_3",
      project_id: projectId,
      title: "Implement rate limiting for auth endpoints",
      description: "Add upstash/ratelimit to /api/auth/* endpoints. Config: 10 req/min for login, 3 req/min for password reset.",
      priority: "P1",
      owner: "Agent",
      owner_type: "agent",
      due: "2026-02-18",
      status: "doing",
      stage: "executing",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["Rate limits enforced", "Proper 429 responses", "Redis integration working"],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_5", "node_3"],
    },
    // To Do Tasks
    {
      id: "task_4",
      project_id: projectId,
      title: "Review PR #251: Add subscription pause feature",
      description: "New feature allowing users to pause subscriptions. Need to verify Stripe subscription update calls and UI state handling.",
      priority: "P1",
      owner: null,
      owner_type: "human",
      due: "2026-02-19",
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_2"],
    },
    {
      id: "task_5",
      project_id: projectId,
      title: "Update database indexes for search queries",
      description: "Add composite indexes on (user_id, created_at) for orders and (product_id, status) for inventory. Benchmark before/after.",
      priority: "P2",
      owner: null,
      owner_type: "human",
      due: null,
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "agent",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_1"],
    },
    {
      id: "task_6",
      project_id: projectId,
      title: "Improve checkout flow UX",
      description: "Address user feedback on checkout confusion. Add progress indicator, improve address form validation, consider auto-save.",
      priority: "P1",
      owner: null,
      owner_type: "human",
      due: "2026-02-25",
      status: "todo",
      stage: "proposed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_12", "node_11"],
    },
    {
      id: "task_7",
      project_id: projectId,
      title: "Review PR #249: API v2 foundation",
      description: "Review the API versioning infrastructure PR. Check middleware setup, route organization, and backward compatibility layer.",
      priority: "P2",
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
      memoryRefs: ["node_8"],
    },
    {
      id: "task_8",
      project_id: projectId,
      title: "Add Stripe webhook signature verification",
      description: "Ensure all webhook endpoints verify Stripe signatures. Add error logging for invalid signatures. Reference Stripe docs.",
      priority: "P0",
      owner: null,
      owner_type: "human",
      due: "2026-02-17",
      status: "todo",
      stage: "approved",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "agent",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_2", "node_10"],
    },
    // Demo: Agent-friendly tasks for testing
    {
      id: "task_email_1",
      project_id: projectId,
      title: "Write email: Weekly status update to stakeholders",
      description: "Draft a professional email summarizing this week's development progress. Include completed tasks, current blockers, and next week's priorities.",
      priority: "P2",
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
      memoryRefs: [],
    },
    {
      id: "task_docs_1",
      project_id: projectId,
      title: "Write documentation: Payment webhook handling",
      description: "Document how our Stripe webhook system works, including event types handled, error recovery, and monitoring.",
      priority: "P2",
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
      memoryRefs: ["node_2", "node_10"],
    },
    // Done Tasks
    {
      id: "task_9",
      project_id: projectId,
      title: "Set up NextAuth with Google OAuth",
      description: "Configure NextAuth.js with Google and GitHub providers. Implement role-based access control.",
      priority: "P0",
      owner: "Marcus",
      owner_type: "human",
      due: null,
      status: "done",
      stage: "completed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: ["Google OAuth working", "GitHub OAuth working", "Roles enforced"],
      parent_task_id: null,
      created_by: "human",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_3"],
    },
    {
      id: "task_10",
      project_id: projectId,
      title: "Review PR #243: Prisma schema updates",
      description: "Reviewed and approved. Added soft delete columns to all tables, updated indexes, migration tested on staging.",
      priority: "P1",
      owner: "Agent",
      owner_type: "agent",
      due: null,
      status: "done",
      stage: "completed",
      blocked: false,
      blocker_reason: null,
      acceptance_criteria: [],
      parent_task_id: null,
      created_by: "agent",
      created_at: now,
      updated_at: now,
      memoryRefs: ["node_1"],
    },
    {
      id: "task_11",
      project_id: projectId,
      title: "Configure GitHub Actions CI/CD",
      description: "Set up automated testing, linting, and Vercel deployments for PRs and main branch.",
      priority: "P1",
      owner: "Sarah",
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
      memoryRefs: ["node_9"],
    },
    {
      id: "task_12",
      project_id: projectId,
      title: "Document code style guidelines",
      description: "Create and document team coding standards. Configure ESLint and Prettier rules.",
      priority: "P2",
      owner: "Agent",
      owner_type: "agent",
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
      memoryRefs: ["node_6"],
    },
  ];

  saveTasks(projectId, tasks);
  return tasks;
}

export function updateTask(projectId: string, taskId: string, updates: Partial<TaskWithMemory>): TaskWithMemory | null {
  const tasks = getTasks(projectId);
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) return null;
  
  tasks[index] = {
    ...tasks[index],
    ...updates,
    id: taskId,
    project_id: projectId,
    updated_at: new Date().toISOString(),
  };
  
  saveTasks(projectId, tasks);
  return tasks[index];
}

export function attachMemoryToTask(projectId: string, taskId: string, nodeId: string): boolean {
  const tasks = getTasks(projectId);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return false;
  if (task.memoryRefs.includes(nodeId)) return false; // Already attached
  
  task.memoryRefs.push(nodeId);
  task.updated_at = new Date().toISOString();
  saveTasks(projectId, tasks);
  return true;
}

export function detachMemoryFromTask(projectId: string, taskId: string, nodeId: string): boolean {
  const tasks = getTasks(projectId);
  const task = tasks.find(t => t.id === taskId);

  if (!task) return false;

  task.memoryRefs = task.memoryRefs.filter(id => id !== nodeId);
  task.updated_at = new Date().toISOString();
  saveTasks(projectId, tasks);
  return true;
}

export function deleteTask(projectId: string, taskId: string): void {
  const tasks = getTasks(projectId);
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(projectId, filtered);
}

// ============ Team Members Storage ============

export function getTeamMembers(projectId: string): TeamMember[] {
  if (typeof window === "undefined") return [];

  const key = TEAM_KEY_PREFIX + projectId;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return createDefaultTeam(projectId);
    }
  }

  return createDefaultTeam(projectId);
}

export function saveTeamMembers(projectId: string, members: TeamMember[]): void {
  if (typeof window === "undefined") return;

  const key = TEAM_KEY_PREFIX + projectId;
  localStorage.setItem(key, JSON.stringify(members));
}

function createDefaultTeam(projectId: string): TeamMember[] {
  const now = new Date().toISOString();

  const members: TeamMember[] = [
    {
      id: "member_1",
      email: "you@company.com",
      name: "You",
      role: "owner",
      addedAt: now,
    },
    {
      id: "member_2",
      email: "sarah.chen@company.com",
      name: "Sarah",
      role: "member",
      addedAt: now,
    },
    {
      id: "member_3",
      email: "marcus.johnson@company.com",
      name: "Marcus",
      role: "member",
      addedAt: now,
    },
    {
      id: "member_4",
      email: "alex.rivera@company.com",
      name: "Alex",
      role: "member",
      addedAt: now,
    },
  ];

  saveTeamMembers(projectId, members);
  return members;
}

export function addTeamMember(projectId: string, email: string, name: string): TeamMember {
  const members = getTeamMembers(projectId);

  const newMember: TeamMember = {
    id: "member_" + Date.now(),
    email,
    name,
    role: "member",
    addedAt: new Date().toISOString(),
  };

  members.push(newMember);
  saveTeamMembers(projectId, members);
  return newMember;
}

export function removeTeamMember(projectId: string, memberId: string): void {
  const members = getTeamMembers(projectId);
  const filtered = members.filter(m => m.id !== memberId);
  saveTeamMembers(projectId, filtered);
}

// ============ Nested Nodes Helpers ============

export function getChildNodes(projectId: string, parentId: string): MemoryNode[] {
  const graph = getGraph(projectId);
  return graph.nodes.filter(n => n.parentId === parentId);
}

export function nestNode(projectId: string, childId: string, parentId: string | null): MemoryNode | null {
  return updateNode(projectId, childId, { parentId });
}
