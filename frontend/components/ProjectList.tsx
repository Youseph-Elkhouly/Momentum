"use client";

import Link from "next/link";
import { getProjects } from "@/lib/projects";
import { useEffect, useState } from "react";
import type { ProjectMeta } from "@/lib/projects";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="border border-border rounded-md bg-white divide-y divide-border">
      {projects.length === 0 ? (
        <div className="px-6 py-12 text-center text-text-secondary text-sm">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <ul className="divide-y divide-border" aria-label="Your projects">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/project/${p.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-hover-bg transition-colors text-left"
              >
                <span className="text-text-primary font-normal">{p.name}</span>
                <span className="text-xs text-text-secondary">
                  {formatDate(p.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
