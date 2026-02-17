"use client";

export function ActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border mt-4">
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-text-primary bg-white border border-border rounded-md hover:bg-hover-bg transition-colors"
      >
        Generate Plan
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-text-primary bg-white border border-border rounded-md hover:bg-hover-bg transition-colors"
      >
        Update from Progress
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-text-primary bg-white border border-border rounded-md hover:bg-hover-bg transition-colors"
      >
        Ask Momentum
      </button>
    </div>
  );
}
