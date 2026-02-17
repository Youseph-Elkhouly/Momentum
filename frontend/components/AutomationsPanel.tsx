"use client";

import { useState } from "react";

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

interface AutomationsPanelProps {
  automations: Automation[];
  onToggle: (id: string, enabled: boolean) => void;
  onRun: (id: string) => Promise<{ success: boolean; message: string }>;
  onToast: (message: string, success: boolean) => void;
}

export function AutomationsPanel({ automations, onToggle, onRun, onToast }: AutomationsPanelProps) {
  const [running, setRunning] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{ id: string; message: string; at: string } | null>(null);

  async function handleRun(id: string) {
    setRunning(id);
    try {
      const res = await onRun(id);
      onToast(res.message, res.success);
      setLastRun({ id, message: res.message, at: new Date().toISOString() });
    } finally {
      setRunning(null);
    }
  }

  if (automations.length === 0) return null;

  return (
    <section className="border-t border-border pt-4 mt-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Automations
        </h3>
      </div>
      <div className="space-y-2">
        {automations.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 p-3 bg-white border border-border/50 rounded-lg hover:border-border transition-colors"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text-primary">{a.name}</span>
              {a.description && (
                <p className="text-[11px] text-text-secondary truncate mt-0.5">{a.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRun(a.id)}
                disabled={running === a.id}
                className={`text-xs font-medium border rounded-lg px-3 py-1.5 transition-all ${
                  running === a.id
                    ? "border-accent/30 bg-accent-light text-accent"
                    : "border-border hover:bg-hover-bg hover:border-text-secondary/30"
                } disabled:cursor-wait`}
              >
                {running === a.id ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onToggle(a.id, !a.enabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  a.enabled ? "bg-accent" : "bg-text-secondary/20"
                }`}
                role="switch"
                aria-checked={a.enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    a.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
        {lastRun && (
          <p className="text-[10px] text-text-secondary flex items-center gap-1.5 pt-2">
            <svg className="w-3 h-3 text-status-done" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lastRun.message}
          </p>
        )}
      </div>
    </section>
  );
}
