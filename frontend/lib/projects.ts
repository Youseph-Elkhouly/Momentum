import type { Task } from "@/components/TaskCard";

const STORAGE_KEY = "momentum-projects";

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

export interface OnboardingAnswers {
  projectName: string;
  goal: string;
  timeline: string;
  teamOrOwner: string;
  successCriteria?: string;
}

export interface ProjectMemory {
  decisions: string[];
  preferences: string[];
  risks: string[];
  summary: string;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  onboarding?: OnboardingAnswers;
  tasks: {
    todo: Task[];
    doing: Task[];
    done: Task[];
  };
  memory: ProjectMemory;
}

function loadAll(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getSeedProjects();
      saveAll(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getSeedProjects();
  }
}

function saveAll(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getSeedProjects(): Project[] {
  return [
    {
      id: "demo-1",
      name: "Momentum UI",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: {
        todo: [
          {
            id: "t1",
            title: "Review project scope",
            description: "Align with stakeholders",
            priority: "P0",
            owner: "You",
            due: "Mar 15",
          },
          {
            id: "t2",
            title: "Set up development environment",
            priority: "P2",
            due: "Mar 18",
          },
        ],
        doing: [
          {
            id: "t3",
            title: "Build Momentum UI",
            description: "Next.js + Tailwind",
            priority: "P1",
            owner: "You",
            due: "Mar 20",
          },
        ],
        done: [
          { id: "t4", title: "Clone repository" },
          { id: "t5", title: "Define UI requirements", owner: "You" },
        ],
      },
      memory: {
        decisions: [
          "Use Next.js App Router for the project.",
          "Keep styling minimal; no component libraries.",
        ],
        preferences: [
          "Monochrome UI; documentation-first tone.",
          "Inter or system font.",
        ],
        risks: ["Scope creep on first release — keep MVP tight."],
        summary:
          "Momentum UI: a minimal, three-column layout (notes, kanban, memory) for an AI agent that turns conversations into execution with long-term project memory.",
      },
    },
  ];
}

/** Generate initial tasks from onboarding answers (placeholder for Gemini output). */
export function generateTasksFromOnboarding(answers: OnboardingAnswers): Project["tasks"] {
  const base = answers.projectName || "New project";
  return {
    todo: [
      {
        id: `gen-1-${Date.now()}`,
        title: `Define scope for ${base}`,
        description: answers.goal || undefined,
        priority: "P0",
        owner: answers.teamOrOwner || "You",
        due: answers.timeline || undefined,
      },
      {
        id: `gen-2-${Date.now()}`,
        title: "Break down milestones",
        priority: "P1",
        owner: answers.teamOrOwner || "You",
      },
      {
        id: `gen-3-${Date.now()}`,
        title: "Set up project structure",
        priority: "P2",
      },
    ],
    doing: [],
    done: [
      {
        id: `gen-0-${Date.now()}`,
        title: "Project created from onboarding",
        owner: "Momentum",
      },
    ],
  };
}

/** Generate initial memory from onboarding (placeholder for Gemini). */
export function generateMemoryFromOnboarding(answers: OnboardingAnswers): ProjectMemory {
  return {
    decisions: [
      `Project name: ${answers.projectName}.`,
      answers.goal ? `Goal: ${answers.goal}.` : "",
    ].filter(Boolean),
    preferences: answers.teamOrOwner
      ? [`Primary owner/team: ${answers.teamOrOwner}.`]
      : [],
    risks: answers.timeline ? [`Target timeline: ${answers.timeline}.`] : [],
    summary: answers.successCriteria
      ? answers.successCriteria
      : `${answers.projectName}: ${answers.goal || "New project"} — timeline ${answers.timeline || "TBD"}.`,
  };
}

export function getProjects(): ProjectMeta[] {
  return loadAll().map((p) => ({
    id: p.id,
    name: p.name,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
  }));
}

export function getProject(id: string): Project | null {
  const projects = loadAll();
  return projects.find((p) => p.id === id) ?? null;
}

export function createProject(answers: OnboardingAnswers): Project {
  const id = `proj-${Date.now()}`;
  const now = new Date().toISOString();
  const tasks = generateTasksFromOnboarding(answers);
  const memory = generateMemoryFromOnboarding(answers);

  const project: Project = {
    id,
    name: answers.projectName,
    createdAt: now,
    updatedAt: now,
    onboarding: answers,
    tasks,
    memory,
  };

  const projects = loadAll();
  projects.unshift(project);
  saveAll(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Pick<Project, "tasks" | "memory" | "name">>): Project | null {
  const projects = loadAll();
  const i = projects.findIndex((p) => p.id === id);
  if (i === -1) return null;
  projects[i] = {
    ...projects[i],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveAll(projects);
  return projects[i];
}
