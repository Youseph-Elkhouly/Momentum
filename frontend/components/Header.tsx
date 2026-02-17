"use client";

import Link from "next/link";
import Image from "next/image";
import { AgentPresence } from "./AgentPresence";
import type { AgentPresenceState } from "./AgentPresence";
import { OpenClawLogo, OPENCLAW_URL } from "./OpenClawLogo";

interface HeaderProps {
  goal: string | null;
  deadline: string | null;
  agentStatus: string;
  agentState: AgentPresenceState;
}

export function Header({
  goal,
  deadline,
  agentStatus,
  agentState,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Logo */}
          <Link href="/projects" className="flex items-center gap-2 shrink-0 group">
            <Image
              src="/image.png"
              alt="Momentum"
              width={320}
              height={80}
              className="h-10 w-auto object-contain sm:h-12 transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Project Info */}
          <div className="flex-1 min-w-0 hidden sm:flex items-center justify-center">
            {(goal || deadline) && (
              <div className="flex items-center gap-3 px-4 py-2 bg-background-alt rounded-full max-w-md">
                {goal && (
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-text-primary truncate" title={goal}>
                      {goal}
                    </span>
                  </div>
                )}
                {deadline && (
                  <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-border">
                    <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-text-secondary">{deadline}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent Status */}
          <div className="shrink-0">
            <AgentPresence state={agentState} message={agentStatus || undefined} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={OPENCLAW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-2 hover:bg-hover-bg hover:border-text-secondary/30 transition-all"
              title="OpenClaw - AI Assistant"
            >
              <OpenClawLogo className="w-4 h-4" />
              <span className="hidden sm:inline">OpenClaw</span>
            </a>
            <Link
              href="/project/new"
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-lg px-3 py-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Project</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
