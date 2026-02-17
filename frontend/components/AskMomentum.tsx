"use client";

import { useState } from "react";

interface Source {
  id?: string;
  type?: string;
  content: string;
}

interface AskMomentumProps {
  onAsk: (question: string) => Promise<{ answer: string; sources_used: Source[] }>;
}

export function AskMomentum({ onAsk }: AskMomentumProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

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
    } catch {
      setAnswer("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 pt-4 border-t border-border">
      <h3 className="text-xs font-medium text-text-primary uppercase tracking-wide mb-2">
        Ask Momentum
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question…"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-border"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="text-sm text-text-primary border border-border rounded-md px-3 py-1.5 hover:bg-hover-bg disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>
      {answer && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-text-primary">{answer}</p>
          {sources.length > 0 && (
            <div className="text-[11px] text-text-secondary border-t border-border pt-2">
              <span className="uppercase tracking-wide">Sources used</span>
              <ul className="mt-1 space-y-0.5 list-none">
                {sources.map((s, i) => (
                  <li key={i}>{s.content}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
