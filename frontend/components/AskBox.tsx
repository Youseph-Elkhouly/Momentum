"use client";

import { useState } from "react";

export interface AskSource {
  id?: string;
  type?: string;
  content: string;
}

interface AskBoxProps {
  onAsk: (question: string) => Promise<{ answer: string; sources_used: AskSource[] }>;
}

export function AskBox({ onAsk }: AskBoxProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<AskSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    try {
      const res = await onAsk(question.trim());
      setAnswer(res.answer);
      setSources(res.sources_used ?? []);
      setSourcesOpen(false);
    } catch {
      setAnswer("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-accent-light/50 rounded-xl p-4 border border-accent/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Ask Momentum</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about decisions, priorities, risks..."
            className="w-full pl-4 pr-12 py-2.5 text-sm border border-border rounded-lg bg-white placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent hover:bg-accent/10 rounded-md disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            aria-label="Ask"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {answer && (
        <div className="mt-4 space-y-3">
          <div className="p-3 border border-border rounded-lg bg-white text-sm text-text-primary leading-relaxed">
            {answer}
          </div>
          {sources.length > 0 && (
            <div className="border border-border rounded-lg bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setSourcesOpen((o) => !o)}
                className="w-full px-3 py-2 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide hover:bg-hover-bg flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {sources.length} source{sources.length !== 1 ? "s" : ""} used
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sourcesOpen && (
                <ul className="px-3 pb-3 space-y-2 list-none text-xs border-t border-border pt-2">
                  {sources.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 bg-background-alt rounded-lg">
                      {s.type && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-text-secondary/10 text-text-secondary rounded">
                          {s.type}
                        </span>
                      )}
                      <span className="text-text-secondary leading-relaxed">{s.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
