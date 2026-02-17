"use client";

/**
 * Momentum logo — monochrome SVG only.
 * Option 1 (default): geometric "M" with forward-leaning middle stroke.
 * Option 2: dot + forward line (progress indicator).
 * Favicon: Use variant="mark" with className="h-8 w-8" (32px), or copy the Symbol
 * into public/logo-mark.svg with viewBox="0 0 24 24" and reference as favicon.ico source.
 */

type LogoVariant = "mark" | "full";
type LogoOption = 1 | 2;

interface LogoProps {
  variant?: LogoVariant;
  option?: LogoOption;
  className?: string;
}

// Option 1: Geometric "M" with forward-leaning middle stroke
function SymbolOption1({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 20V4l6 8 4-8 6 16" />
    </svg>
  );
}

// Option 2: Dot + forward line (progress indicator)
function SymbolOption2({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="6" cy="12" r="2" fill="currentColor" />
      <path d="M10 12h8" />
      <path d="M18 8v8" />
    </svg>
  );
}

export function Logo({ variant = "full", option = 1, className = "" }: LogoProps) {
  const Symbol = option === 1 ? SymbolOption1 : SymbolOption2;
  const symbolClass = variant === "mark" ? className : "h-6 w-6 flex-shrink-0";

  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`}>
        <Symbol className={symbolClass} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Symbol className={symbolClass} />
      <span className="text-lg font-medium tracking-tight text-text-primary">Momentum</span>
    </span>
  );
}
