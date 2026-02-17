"use client";

const OPENCLAW_URL = "https://openclaw.ai/";

/** Small OpenClaw logo (claw/lobster style) for use in buttons or links. */
export function OpenClawLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Simple claw shape: two curved pincers */}
      <path d="M8 6c-2 2-3 5-2 8 1 2 3 3 5 2" />
      <path d="M16 6c2 2 3 5 2 8-1 2-3 3-5 2" />
      <path d="M12 4v4M10 8h4" />
    </svg>
  );
}

export function OpenClawLink({
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={OPENCLAW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

export { OPENCLAW_URL };
