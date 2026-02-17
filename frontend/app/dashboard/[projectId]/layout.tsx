"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { LocalStoreProvider, useLocalStore } from "@/lib/local-store";
import { Sidebar } from "@/components/agentic/Sidebar";
import { TopBar } from "@/components/agentic/TopBar";
import { CommandBar } from "@/components/agentic/CommandBar";
import { ToastProvider } from "@/components/ui/Toast";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useLocalStore();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl + K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_COMMAND_BAR", payload: true });
      }
      // Escape to close command bar
      if (e.key === "Escape" && state.commandBarOpen) {
        dispatch({ type: "TOGGLE_COMMAND_BAR", payload: false });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, state.commandBarOpen]);

  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-text-secondary">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandBar />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <LocalStoreProvider projectId={projectId}>
      <ToastProvider>
        <DashboardContent>{children}</DashboardContent>
      </ToastProvider>
    </LocalStoreProvider>
  );
}
