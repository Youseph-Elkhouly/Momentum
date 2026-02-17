"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ProjectMeta {
  id: string;
  name: string;
  updated_at?: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function selectProject(projectId: string) {
    await fetch("/api/projects/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="px-4 sm:px-6 py-3">
          <Link href="/projects" className="inline-flex items-center shrink-0">
            <Image
              src="/image.png"
              alt="Momentum"
              width={280}
              height={64}
              className="h-14 w-auto object-contain sm:h-16 md:h-20 lg:h-24"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-medium text-text-primary mb-2">
          Choose a project
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Select a project to open its dashboard, or create a new one.
        </p>

        <Link
          href="/project/new"
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 mb-6 text-sm text-text-primary bg-white border border-border rounded-md hover:bg-hover-bg transition-colors"
        >
          New project
        </Link>

        {loading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : (
          <div className="border border-border rounded-md bg-white divide-y divide-border">
            {projects.length === 0 ? (
              <div className="px-6 py-12 text-center text-text-secondary text-sm">
                No projects yet. Create one to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border" aria-label="Your projects">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectProject(p.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-hover-bg transition-colors text-left"
                    >
                      <span className="text-text-primary font-normal">{p.name}</span>
                      <span className="text-xs text-text-secondary">
                        {p.updated_at ? formatDate(p.updated_at) : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
