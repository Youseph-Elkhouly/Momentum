"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStore } from "@/lib/local-store";

// Momentum Logo Component
function MomentumLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left parallelogram */}
      <path d="M0 32L8 0H16L8 32H0Z" fill="currentColor" />
      {/* Middle parallelogram */}
      <path d="M12 32L20 0H28L20 32H12Z" fill="currentColor" />
      {/* Right parallelogram (taller) */}
      <path d="M24 32L32 0H40L32 32H24Z" fill="currentColor" />
    </svg>
  );
}

const navItems = [
  {
    name: "Overview",
    href: "",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: "Runs",
    href: "/runs",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    badge: "runs",
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Memory",
    href: "/memory",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    name: "Automations",
    href: "/automations",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, dispatch, currentProject, pendingApprovals, runningRuns } = useLocalStore();

  const projectId = currentProject?.id || "demo";
  const basePath = `/dashboard/${projectId}`;

  return (
    <aside
      className={`bg-white border-r border-border flex flex-col transition-all duration-200 ${
        state.sidebarCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <MomentumLogo className="w-7 h-6 text-gray-900" />
          {!state.sidebarCollapsed && <span className="font-semibold text-gray-900 tracking-tight">Momentum</span>}
        </Link>
        <button
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-bg rounded-md transition-colors"
          aria-label={state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {state.sidebarCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Project name */}
      {!state.sidebarCollapsed && (
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Project</div>
          <div className="text-sm font-medium text-text-primary truncate">{currentProject?.name || "Loading..."}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive = item.href === "" ? pathname === basePath || pathname === `${basePath}/` : pathname.startsWith(href);

          return (
            <Link
              key={item.name}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
                isActive ? "bg-accent-light text-accent" : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
              } ${state.sidebarCollapsed ? "justify-center" : ""}`}
              title={state.sidebarCollapsed ? item.name : undefined}
            >
              <span className={isActive ? "text-accent" : "text-text-secondary"}>{item.icon}</span>
              {!state.sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge === "runs" && runningRuns.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-accent text-white">{runningRuns.length}</span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Approvals section */}
      {pendingApprovals.length > 0 && (
        <div className="px-2 pb-3">
          <Link
            href={`${basePath}/runs?filter=needs_approval`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors ${
              state.sidebarCollapsed ? "justify-center" : ""
            }`}
            title={state.sidebarCollapsed ? `${pendingApprovals.length} pending approvals` : undefined}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {!state.sidebarCollapsed && (
              <>
                <span className="flex-1">Approvals</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-200 text-amber-800">
                  {pendingApprovals.length}
                </span>
              </>
            )}
          </Link>
        </div>
      )}

      {/* Settings */}
      <div className="px-2 py-3 border-t border-border">
        <Link
          href={`${basePath}/settings`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-hover-bg hover:text-text-primary transition-colors ${
            state.sidebarCollapsed ? "justify-center" : ""
          } ${pathname.includes("/settings") ? "bg-hover-bg text-text-primary" : ""}`}
          title={state.sidebarCollapsed ? "Settings" : undefined}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!state.sidebarCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
