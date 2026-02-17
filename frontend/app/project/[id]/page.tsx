"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirect to dashboard with this project set as current.
 * The main dashboard lives at / and uses the API + SQLite.
 */
export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id) {
      router.replace("/");
      return;
    }
    fetch("/api/projects/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: id }),
    })
      .then((r) => (r.ok ? undefined : Promise.reject()))
      .finally(() => router.replace("/"));
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary text-sm">
      Opening project…
    </div>
  );
}
