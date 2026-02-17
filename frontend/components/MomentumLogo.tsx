/**
 * Momentum logo — monochrome, geometric.
 * Options: "mark" (symbol only), "full" (symbol + wordmark).
 *
 * Usage:
 * - Header: <MomentumLogo variant="full" className="h-8" />
 * - Favicon: use logo-mark.svg (symbol only, 32×32 or single viewBox)
 *
 * Rationale:
 * - Forward motion: angled strokes read left-to-right, upward.
 * - Continuity: repeated parallel elements suggest ongoing flow.
 * - Intelligence: minimal, precise geometry; no decoration.
 */

interface MomentumLogoProps {
  variant?: "mark" | "full";
  className?: string;
}

export function MomentumLogo({ variant = "full", className = "" }: MomentumLogoProps) {
  const symbol = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={variant === "mark" ? className : "h-6 w-6 flex-shrink-0"}
      aria-hidden
    >
      {/* Forward motion: ascending strokes left to right */}
      <line x1="4" y1="18" x2="4" y2="8" />
      <line x1="8" y1="18" x2="8" y2="6" />
      <line x1="12" y1="18" x2="12" y2="10" />
      <line x1="16" y1="14" x2="16" y2="8" />
      <line x1="20" y1="18" x2="20" y2="12" />
    </svg>
  );

  if (variant === "mark") {
    return <span className={`inline-flex ${className}`}>{symbol}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {symbol}
      <span className="text-lg font-medium tracking-tight text-text-primary">
        Momentum
      </span>
    </span>
  );
}
