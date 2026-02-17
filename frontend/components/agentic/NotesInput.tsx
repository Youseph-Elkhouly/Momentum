"use client";

import { useState } from "react";
import { useLocalStore } from "@/lib/local-store";

export function NotesInput() {
  const { createMemory } = useLocalStore();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    createMemory(content.trim(), "note");
    setContent("");
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg overflow-hidden">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note to project memory..."
        className="w-full px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary resize-none border-none outline-none"
        rows={3}
        aria-label="Note content"
      />
      <div className="px-4 py-2 bg-background border-t border-border flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isSaving}
          className="px-3 py-1.5 text-xs font-medium text-white bg-text-primary rounded-lg hover:bg-text-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save to Memory"}
        </button>
      </div>
    </form>
  );
}
