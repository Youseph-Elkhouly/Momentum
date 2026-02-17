"use client";

import Link from "next/link";
import { MomentumLogo } from "./MomentumLogo";

export interface ProjectOption {
  id: string;
  name: string;
}

interface DashboardHeaderProps {
  projects: ProjectOption[];
  currentProjectId: string | null;
  projectName: string;
  goal: string | null;
  deadline: string | null;
  agentStatus: string;
  onProjectChange: (projectId: string) => void;
}

export function DashboardHeader({
  projects,
  currentProjectId,
  projectName,
  goal,
  deadline,
  agentStatus,
  onProjectChange,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="px-6 py-4 flex flex-wrap items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <MomentumLogo variant="full" className="h-8" />
        </Link>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <label htmlFor="project-select" className="sr-only">
            Select project
          </label>
          <select
            id="project-select"
            value={currentProjectId ?? (projects[0]?.id ?? "")}
            onChange={(e) => { const v = e.target.value; if (v) onProjectChange(v); }}
            className="text-sm text-text-primary bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-border"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {goal && (
            <span className="text-xs text-text-secondary max-w-[200px] truncate" title={goal}>
              {goal}
            </span>
          )}
          {deadline && (
            <span className="text-xs text-text-secondary">
              Due {deadline}
            </span>
          )}
        </div>

        <p className="text-xs text-text-secondary ml-auto" aria-live="polite">
          {agentStatus || "Momentum ready"}
        </p>
        <Link
          href="/project/new"
          className="text-xs text-text-secondary hover:text-text-primary border border-border rounded px-2 py-1"
        >
          New project
        </Link>
      </div>
    </header>
  );
}
