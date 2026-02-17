"use client";

export type AIStatusType = "ready" | "analyzing" | "remembering" | "updating";

const STATUS_LABELS: Record<AIStatusType, string> = {
  ready: "Momentum ready",
  analyzing: "Analyzing…",
  remembering: "Remembering…",
  updating: "Updating plan…",
};

interface AIStatusProps {
  status?: AIStatusType;
}

export function AIStatus({ status = "ready" }: AIStatusProps) {
  return (
    <p
      className="text-xs text-text-secondary transition-opacity duration-200"
      aria-live="polite"
      aria-atomic="true"
    >
      {STATUS_LABELS[status]}
    </p>
  );
}
