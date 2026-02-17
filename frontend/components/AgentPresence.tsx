"use client";

export type AgentPresenceState = "idle" | "loading" | "success";

const STATE_CONFIG: Record<AgentPresenceState, { label: string; color: string; bgColor: string; animate: boolean }> = {
  idle: {
    label: "Ready",
    color: "text-text-secondary",
    bgColor: "bg-text-secondary/30",
    animate: false,
  },
  loading: {
    label: "Processing",
    color: "text-accent",
    bgColor: "bg-accent",
    animate: true,
  },
  success: {
    label: "Updated",
    color: "text-status-done",
    bgColor: "bg-status-done",
    animate: false,
  },
};

interface AgentPresenceProps {
  state: AgentPresenceState;
  message?: string;
}

export function AgentPresence({ state, message }: AgentPresenceProps) {
  const config = STATE_CONFIG[state];
  const label = message ?? config.label;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
        state === "loading"
          ? "bg-accent-light border-accent/20"
          : state === "success"
          ? "bg-status-done/10 border-status-done/20"
          : "bg-background-alt border-transparent"
      }`}
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        {config.animate && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.bgColor}`} />
      </span>
      <span className={`text-xs font-medium ${config.color}`}>{label}</span>
    </div>
  );
}
