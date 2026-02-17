"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PlanPreviewTask {
  title: string;
  description?: string;
  priority: string;
  column_id: string;
}

export interface PlanPreview {
  summary: string;
  decisions: string[];
  preferences: string[];
  tasks: PlanPreviewTask[];
}

interface NotesPanelProps {
  value: string;
  onChange: (value: string) => void;
  onGeneratePlan: () => void;
  onUpdateFromProgress: () => void;
  onAskMomentum?: () => void;
  loading?: boolean;
  lastProcessed?: string | null;
  repoUrl?: string | null;
  onRepoUrlChange?: (url: string) => void;
  onTranscribe?: (file: File) => Promise<void>;
  planPreview?: PlanPreview | null;
  onApplyPlan?: (selected: { title: string; description?: string; priority: string; column_id: string }[]) => void;
  onDismissPlanPreview?: () => void;
}

export function NotesPanel({
  value,
  onChange,
  onGeneratePlan,
  onUpdateFromProgress,
  onAskMomentum,
  loading = false,
  lastProcessed,
  repoUrl = null,
  onRepoUrlChange,
  onTranscribe,
  planPreview,
  onApplyPlan,
  onDismissPlanPreview,
}: NotesPanelProps) {
  const [selectedTasks, setSelectedTasks] = useState<Record<number, boolean>>({});
  const [taskPriorities, setTaskPriorities] = useState<Record<number, string>>({});
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [repoInput, setRepoInput] = useState(repoUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRepoInput(repoUrl ?? "");
  }, [repoUrl]);

  useEffect(() => {
    if (planPreview?.tasks) {
      const all: Record<number, boolean> = {};
      const pri: Record<number, string> = {};
      planPreview.tasks.forEach((_, i) => {
        all[i] = true;
        pri[i] = planPreview.tasks[i].priority ?? "P2";
      });
      setSelectedTasks(all);
      setTaskPriorities(pri);
    }
  }, [planPreview?.tasks]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onTranscribe) return;
      setTranscribeLoading(true);
      onTranscribe(file).finally(() => {
        setTranscribeLoading(false);
        e.target.value = "";
      });
    },
    [onTranscribe]
  );

  const handleApply = useCallback(() => {
    if (!planPreview || !onApplyPlan) return;
    const list = planPreview.tasks
      .map((t, i) => (selectedTasks[i] ? { ...t, priority: taskPriorities[i] ?? t.priority } : null))
      .filter(Boolean) as { title: string; description?: string; priority: string; column_id: string }[];
    onApplyPlan(list);
  }, [planPreview, selectedTasks, taskPriorities, onApplyPlan]);

  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="flex flex-col">
      {/* Repository Section */}
      {onRepoUrlChange && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Repository</h3>
          </div>
          <input
            type="url"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onBlur={() => onRepoUrlChange(repoInput)}
            placeholder="https://github.com/owner/repo"
            className="w-full px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          />
        </div>
      )}

      {/* Notes Section */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Notes</h2>
          </div>
          {onTranscribe && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,audio/mpeg,audio/mp3"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={transcribeLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-hover-bg hover:border-text-secondary/30 disabled:opacity-50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {transcribeLoading ? "Importing…" : "Import MP3"}
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] text-text-secondary mb-3">
          Paste meeting notes, decisions, blockers, or import audio.
        </p>
        <label htmlFor="notes-panel-input" className="sr-only">
          Notes input
        </label>
        <textarea
          id="notes-panel-input"
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste meeting notes, decisions, or blockers..."
          className="w-full resize-none min-h-[100px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 bg-white border border-border rounded-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          disabled={loading}
        />

        {/* Status indicators */}
        <div className="flex items-center justify-between mt-2">
          {lastProcessed && (
            <p className="text-[10px] text-text-secondary flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last processed: {lastProcessed}
            </p>
          )}
          {loading && (
            <p className="flex items-center gap-1.5 text-[11px] text-accent font-medium">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden />
              Analyzing…
            </p>
          )}
        </div>
      </div>

      {/* Plan Preview */}
      {planPreview && onApplyPlan && onDismissPlanPreview && (
        <div className="mt-4 p-4 border border-accent/30 rounded-xl bg-accent-light/50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-sm font-semibold text-text-primary">Review Generated Tasks</h3>
          </div>
          {planPreview.summary && (
            <p className="text-xs text-text-secondary mb-3 p-2 bg-white/60 rounded-lg">{planPreview.summary}</p>
          )}
          <ul className="space-y-2 max-h-[180px] overflow-y-auto mb-4">
            {planPreview.tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-border/50">
                <input
                  type="checkbox"
                  checked={selectedTasks[i] !== false}
                  onChange={(e) => setSelectedTasks((s) => ({ ...s, [i]: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">{t.title}</span>
                  {t.description && (
                    <span className="text-text-secondary block text-[11px] mt-0.5 line-clamp-1">{t.description}</span>
                  )}
                </div>
                <select
                  value={taskPriorities[i] ?? t.priority}
                  onChange={(e) => setTaskPriorities((p) => ({ ...p, [i]: e.target.value }))}
                  className="text-[11px] font-medium border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="P0">P0 Critical</option>
                  <option value="P1">P1 High</option>
                  <option value="P2">P2 Normal</option>
                </select>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedCount} task{selectedCount !== 1 ? "s" : ""}
            </button>
            <button
              type="button"
              onClick={onDismissPlanPreview}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-hover-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!planPreview && (
        <div className="flex gap-2 pt-3 mt-3">
          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={loading || !value.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Plan
          </button>
          <button
            type="button"
            onClick={onUpdateFromProgress}
            disabled={loading || !value.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-text-primary bg-white border border-border rounded-lg hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Update
          </button>
        </div>
      )}
    </div>
  );
}
