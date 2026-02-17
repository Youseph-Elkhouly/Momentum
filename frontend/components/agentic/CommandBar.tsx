"use client";

import { useState, useEffect, useRef } from "react";
import { useLocalStore } from "@/lib/local-store";
import { useRouter } from "next/navigation";

interface CommandSuggestion {
  id: string;
  command: string;
  description: string;
  category: string;
  icon: string;
}

const SUGGESTIONS: CommandSuggestion[] = [
  { id: "1", command: "/plan", description: "Create a plan from a goal or task", category: "plan", icon: "📋" },
  { id: "2", command: "/run", description: "Execute a workflow or automation", category: "run", icon: "⚡" },
  { id: "3", command: "/sync tasks", description: "Sync tasks to external tools", category: "sync", icon: "🔄" },
  { id: "4", command: "/summarize", description: "Summarize recent activity", category: "summarize", icon: "📝" },
  { id: "5", command: "/generate", description: "Generate code, docs, or content", category: "generate", icon: "✨" },
  { id: "6", command: "/create-task", description: "Create a new task", category: "task", icon: "➕" },
  { id: "7", command: "/recall", description: "Search project memory", category: "memory", icon: "🧠" },
  { id: "8", command: "/remember", description: "Save to project memory", category: "memory", icon: "💾" },
  { id: "9", command: "/break down", description: "Break a task into subtasks", category: "plan", icon: "📊" },
  { id: "10", command: "/review", description: "Review code or PRs", category: "other", icon: "👀" },
];

export function CommandBar() {
  const { state, dispatch, createRun, currentProject } = useLocalStore();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = input.trim()
    ? SUGGESTIONS.filter(
        (s) =>
          s.command.toLowerCase().includes(input.toLowerCase()) ||
          s.description.toLowerCase().includes(input.toLowerCase())
      )
    : SUGGESTIONS.slice(0, 6);

  // Focus input when opened
  useEffect(() => {
    if (state.commandBarOpen && inputRef.current) {
      inputRef.current.focus();
      setInput("");
      setSelectedIndex(0);
    }
  }, [state.commandBarOpen]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSuggestions.length]);

  const handleSubmit = (command?: string) => {
    const cmd = command || input;
    if (!cmd.trim()) return;

    // Close command bar
    dispatch({ type: "TOGGLE_COMMAND_BAR", payload: false });
    setInput("");

    // Create a run
    createRun(cmd);

    // Navigate to runs page
    if (currentProject) {
      router.push(`/dashboard/${currentProject.id}/runs`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions[selectedIndex] && input.startsWith("/")) {
        handleSubmit(filteredSuggestions[selectedIndex].command);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Tab" && filteredSuggestions[selectedIndex]) {
      e.preventDefault();
      setInput(filteredSuggestions[selectedIndex].command + " ");
    }
  };

  if (!state.commandBarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dispatch({ type: "TOGGLE_COMMAND_BAR", payload: false })}
        aria-hidden="true"
      />

      {/* Command Bar */}
      <div
        className="relative w-full max-w-2xl bg-white border border-border rounded-xl shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command bar"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like Momentum to do?"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary outline-none text-sm"
            aria-label="Command input"
          />
          <kbd className="px-2 py-0.5 text-[10px] text-text-secondary bg-background border border-border rounded">ESC</kbd>
        </div>

        {/* Suggestions */}
        <div className="max-h-80 overflow-y-auto" role="listbox">
          {filteredSuggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">Commands</div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSubmit(suggestion.command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === selectedIndex ? "bg-accent-light" : "hover:bg-hover-bg"
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                      index === selectedIndex ? "bg-accent/10" : "bg-hover-bg"
                    }`}
                  >
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${index === selectedIndex ? "text-accent" : "text-text-primary"}`}>
                      {suggestion.command}
                    </div>
                    <div className="text-xs text-text-secondary truncate">{suggestion.description}</div>
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-2 py-0.5 text-[10px] bg-accent/10 text-accent rounded">Enter</kbd>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-text-secondary text-sm">
              Press <span className="font-medium">Enter</span> to run: &quot;{input}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-background flex items-center justify-between text-[10px] text-text-secondary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-border rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-border rounded">Tab</kbd>
              Complete
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-border rounded">Enter</kbd>
              Run
            </span>
          </div>
          <span>Powered by OpenClaw</span>
        </div>
      </div>
    </div>
  );
}
