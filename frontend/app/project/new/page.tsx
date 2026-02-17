"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SimpleHeader } from "@/components/SimpleHeader";

const FIELDS: { key: string; label: string; placeholder: string; required?: boolean }[] = [
  { key: "projectName", label: "Project name", placeholder: "e.g. Q1 Launch", required: true },
  { key: "goal", label: "What’s the goal?", placeholder: "Describe what success looks like" },
  { key: "timeline", label: "Timeline", placeholder: "e.g. 6 weeks, by March 30" },
  { key: "teamOrOwner", label: "Team or owner", placeholder: "Who’s responsible?" },
  { key: "successCriteria", label: "Success criteria (optional)", placeholder: "How we’ll know we’re done" },
];

const INITIAL: Record<string, string> = {
  projectName: "",
  goal: "",
  timeline: "",
  teamOrOwner: "",
  successCriteria: "",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answers.projectName.trim()) return;
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: answers.projectName.trim(),
          goal: answers.goal?.trim() || undefined,
          deadline: answers.timeline?.trim() || undefined,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create project");
      const project = await createRes.json();
      await fetch("/api/projects/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      router.replace("/");
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SimpleHeader />

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        <Link
          href="/"
          className="text-sm text-text-secondary hover:text-text-primary mb-6 inline-block"
        >
          ← Back to projects
        </Link>

        <h1 className="text-xl font-medium text-text-primary mb-1">
          New project
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Answer a few questions so Momentum can set up your project and generate an initial plan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label
                htmlFor={f.key}
                className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-1.5"
              >
                {f.label}
                {f.required && <span className="text-text-primary"> *</span>}
              </label>
              <input
                id={f.key}
                type="text"
                value={answers[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 text-text-primary placeholder:text-text-secondary bg-white border border-border rounded-md text-[15px] focus:outline-none focus:ring-1 focus:ring-border focus:border-border"
                required={!!f.required}
              />
            </div>
          ))}

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || !answers.projectName.trim()}
              className="px-4 py-2 text-sm text-text-primary bg-white border border-border rounded-md hover:bg-hover-bg transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Creating…" : "Create project"}
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
