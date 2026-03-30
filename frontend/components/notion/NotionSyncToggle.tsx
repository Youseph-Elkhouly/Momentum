"use client";

import { useState } from "react";

interface NotionSyncToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function NotionSyncToggle({
  enabled,
  onToggle,
  disabled = false,
  showLabel = true,
}: NotionSyncToggleProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            enabled ? "bg-neutral-700" : "bg-neutral-800"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
              enabled
                ? "translate-x-5 bg-white"
                : "translate-x-0 bg-neutral-500"
            }`}
          />
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-400 flex items-center gap-1">
          <NotionIcon className="w-3 h-3" />
          Sync to Notion
        </span>
      )}
    </label>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.44 17.67c3.94 2.92 5.4 2.72 12.77 2.23l44.05-2.64c1.48 0 .25-1.48-.25-1.72l-7.38-5.42c-2.22-1.72-5.16-3.69-10.82-3.2L16.99 10.6c-2.47.25-2.96 1.48-1.97 2.47l5.42 4.6zm4.19 13.76v46.31c0 2.47 1.23 3.45 3.94 3.2l48.23-2.72c2.72-.25 2.96-1.97 2.96-4.19V28.14c0-2.22-.74-3.45-2.72-3.2l-50.45 2.96c-2.22.25-1.97 1.72-1.97 3.53zm47.5 3.7c.49 2.22 0 4.44-2.23 4.69l-2.22.49v34.27c-1.97 1.23-3.94 1.72-5.17 1.72-2.47 0-2.96-.74-4.68-2.96L40.24 48.91v23.68l4.93 1.23s0 4.44-6.15 4.44l-16.83.98c-.49-1.23 0-4.18 1.97-4.68l4.44-1.48V39.93l-6.14-.49c-.49-2.22.74-5.42 4.18-5.67l18.05-1.23 18.55 28.37V37.72l-4.19-.5c-.49-2.72 1.48-4.68 3.94-4.93l16.59-.99z"
      />
    </svg>
  );
}

export function NotionSyncStatus({
  synced,
  syncedAt,
  notionUrl,
}: {
  synced: boolean;
  syncedAt?: string;
  notionUrl?: string;
}) {
  if (!synced) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-neutral-500">
      <NotionIcon className="w-3 h-3" />
      <span>Synced</span>
      {syncedAt && (
        <span className="text-neutral-600">
          {new Date(syncedAt).toLocaleDateString()}
        </span>
      )}
      {notionUrl && (
        <a
          href={notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 hover:text-white underline"
        >
          View
        </a>
      )}
    </div>
  );
}

export function NotionSyncButton({
  taskId,
  onSync,
  syncing = false,
  synced = false,
}: {
  taskId: string;
  onSync: (taskId: string) => Promise<void>;
  syncing?: boolean;
  synced?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onSync(taskId);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = syncing || isLoading;

  return (
    <button
      onClick={handleClick}
      disabled={loading || synced}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
        synced
          ? "bg-neutral-800 text-neutral-500 cursor-default"
          : loading
          ? "bg-neutral-800 text-neutral-400 cursor-wait"
          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
      }`}
    >
      <NotionIcon className="w-3 h-3" />
      {loading ? (
        <>
          <span className="animate-pulse">Syncing...</span>
        </>
      ) : synced ? (
        "Synced"
      ) : (
        "Push to Notion"
      )}
    </button>
  );
}
