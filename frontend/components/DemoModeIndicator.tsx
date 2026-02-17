"use client";

import { useState, useEffect } from "react";

interface ProviderStatus {
  openclaw: boolean;
  backboard: boolean;
  gemini: boolean;
}

export function DemoModeIndicator() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check provider status on mount
    checkProviderStatus().then(setStatus);
  }, []);

  if (!status) return null;

  const isFullDemo = !status.openclaw && !status.backboard && !status.gemini;
  const hasAnyProvider = status.openclaw || status.backboard || status.gemini;

  if (hasAnyProvider && !expanded) {
    return null; // Don't show if at least one provider is configured
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isFullDemo
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
            : "bg-green-100 text-green-800 hover:bg-green-200"
        }`}
      >
        {isFullDemo ? "Demo Mode" : "Connected"}
      </button>

      {expanded && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-sm mb-2">AI Provider Status</h4>

          <div className="space-y-2 text-xs">
            <StatusRow
              name="OpenClaw (Local)"
              configured={status.openclaw}
              hint="pip install openclaw && openclaw serve"
            />
            <StatusRow
              name="Backboard API"
              configured={status.backboard}
              hint="Set BACKBOARD_API_KEY"
            />
            <StatusRow
              name="Google Gemini"
              configured={status.gemini}
              hint="Set GOOGLE_GEMINI_API_KEY"
            />
          </div>

          {isFullDemo && (
            <p className="mt-3 text-xs text-gray-500">
              Running in demo mode. AI features will use mock responses.
            </p>
          )}

          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function StatusRow({
  name,
  configured,
  hint,
}: {
  name: string;
  configured: boolean;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`w-2 h-2 rounded-full mt-1 ${
          configured ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <div className="flex-1">
        <span className={configured ? "text-gray-900" : "text-gray-500"}>
          {name}
        </span>
        {!configured && (
          <p className="text-gray-400 text-[10px] mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

async function checkProviderStatus(): Promise<ProviderStatus> {
  try {
    const response = await fetch("/api/status");
    if (response.ok) {
      return response.json();
    }
  } catch {
    // Ignore errors
  }

  // Default to demo mode if we can't check
  return {
    openclaw: false,
    backboard: false,
    gemini: false,
  };
}
