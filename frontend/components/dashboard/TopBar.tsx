"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { commandSuggestions } from "@/lib/mock-data";

export function TopBar() {
  const { state, dispatch, runsList } = useStore();
  const [commandInput, setCommandInput] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof commandSuggestions>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const runningRuns = runsList.filter((r) => r.status === "running");
  const isConnected = true; // Mock OpenClaw connection status

  // Focus input when command bar opens
  useEffect(() => {
    if (state.commandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.commandBarOpen]);

  // Filter suggestions based on input
  useEffect(() => {
    if (commandInput.trim()) {
      const filtered = commandSuggestions.filter(
        (s) =>
          s.description.toLowerCase().includes(commandInput.toLowerCase()) ||
          s.command.toLowerCase().includes(commandInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredSuggestions(commandSuggestions.slice(0, 5));
    }
  }, [commandInput]);

  const handleCommandSubmit = async (command: string) => {
    if (!command.trim() || !state.currentProject) return;

    // Close command bar
    dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: false });
    setCommandInput("");

    // Create a new run
    try {
      const res = await fetch(`/api/projects/${state.currentProject.id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();

      if (data.run) {
        dispatch({ type: "ADD_RUN", payload: data.run });
        if (data.approval) {
          dispatch({ type: "ADD_APPROVAL", payload: data.approval });
        }
      }
    } catch (error) {
      console.error("Failed to create run:", error);
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
      if (filteredSuggestions[selectedIndex]) {
        handleCommandSubmit(filteredSuggestions[selectedIndex].command);
      } else {
        handleCommandSubmit(commandInput);
      }
    } else if (e.key === "Tab" && filteredSuggestions[selectedIndex]) {
      e.preventDefault();
      setCommandInput(filteredSuggestions[selectedIndex].command);
    }
  };

  return (
    <>
      <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-4">
        {/* Left: Breadcrumb / Project info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-text-muted">Dashboard</span>
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-text-primary truncate">
            {state.currentProject?.name}
          </span>
        </div>

        {/* Center: Command Bar trigger */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: true })}
            className="flex items-center gap-2 px-4 py-2 w-full max-w-md bg-background border border-border rounded-lg text-sm text-text-muted hover:border-accent/50 hover:text-text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">Ask Momentum anything...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-surface border border-border rounded">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Status indicators */}
        <div className="flex items-center gap-3">
          {/* Running indicator */}
          {runningRuns.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">
                {runningRuns.length} running
              </span>
            </div>
          )}

          {/* OpenClaw connection status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isConnected ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isConnected ? "text-green-500" : "text-red-500"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* New Run button */}
          <button
            onClick={() => dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: true })}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Run
          </button>
        </div>
      </header>

      {/* Command Bar Modal */}
      {state.commandBarOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: false })}
          />

          {/* Command Bar */}
          <div
            ref={dropdownRef}
            className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like Momentum to do?"
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
              />
              <kbd className="px-2 py-0.5 text-xs text-text-muted bg-background border border-border rounded">
                ESC
              </kbd>
            </div>

            {/* Suggestions */}
            <div className="max-h-80 overflow-y-auto">
              {filteredSuggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-xs text-text-muted uppercase tracking-wider">
                    Suggestions
                  </div>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleCommandSubmit(suggestion.command)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        index === selectedIndex
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          index === selectedIndex ? "bg-accent/20" : "bg-surface-hover"
                        }`}
                      >
                        <span className="text-lg">{suggestion.icon || "⚡"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {suggestion.command}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {suggestion.description}
                        </div>
                      </div>
                      {index === selectedIndex && (
                        <kbd className="px-2 py-0.5 text-xs bg-accent/20 rounded">
                          Enter
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-text-muted text-sm">
                  Press Enter to run: &quot;{commandInput}&quot;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border bg-background/50 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Tab</kbd>
                  Complete
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Enter</kbd>
                  Run
                </span>
              </div>
              <span>Powered by OpenClaw</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
