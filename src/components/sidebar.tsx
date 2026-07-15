"use client";

import { motion } from "framer-motion";
import { useApp } from "@/context/app-context";
import type { Role, ViewId } from "@/lib/types";
import { cn } from "@/lib/utils";

const nav: { id: ViewId; label: string; short: string }[] = [
  { id: "dashboard", label: "Dashboard", short: "D" },
  { id: "matches", label: "Match Center", short: "⚽" },
  { id: "map", label: "Stadium Map", short: "M" },
  { id: "incidents", label: "Incidents", short: "!" },
  { id: "gates", label: "Gate Flow", short: "G" },
  { id: "queues", label: "Queues", short: "Q" },
  { id: "transit", label: "Transit", short: "T" },
  { id: "sustainability", label: "Sustainability", short: "S" },
  { id: "accessibility", label: "Accessibility", short: "A" },
  { id: "volunteers", label: "Volunteers", short: "V" },
  { id: "settings", label: "Settings", short: "·" },
];

const roles: Role[] = ["fan", "staff", "organizer"];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { state, setView, currentUser, logout } = useApp();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-claude-border bg-claude-card/90 backdrop-blur-md transition-all duration-500 ease-smooth",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-claude-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-claude-accent font-serif text-sm font-semibold text-white">
          26
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0"
          >
            <div className="truncate font-serif text-base font-medium text-claude-ink">
              Smart Stadium
            </div>
            <div className="truncate text-[11px] text-claude-ink-muted">FIFA 2026 Ops</div>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Primary">
        {nav.map((item) => {
          const active = state.selectedView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-300 ease-smooth",
                active
                  ? "bg-claude-accent-soft text-claude-accent"
                  : "text-claude-ink-secondary hover:bg-claude-surface hover:text-claude-ink"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-claude-accent-soft"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                  active ? "bg-claude-accent text-white" : "bg-claude-surface text-claude-ink-muted"
                )}
              >
                {item.short}
              </span>
              {!collapsed && (
                <span className="relative z-10 truncate font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-claude-border p-3">
        {currentUser && (
          <div className="space-y-3">
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-claude-accent-soft font-serif text-sm font-semibold text-claude-accent"
                  title={`${currentUser.role} mode: ${currentUser.id}`}
                >
                  {currentUser.role[0].toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-claude-danger hover:bg-claude-danger-soft transition"
                  title="Log Out"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-claude-surface/50 p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-claude-accent-soft font-serif text-sm font-semibold text-claude-accent">
                    {currentUser.role[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-claude-ink">
                      {currentUser.id}
                    </div>
                    <div className="truncate text-[10px] font-medium capitalize text-claude-accent">
                      {currentUser.role}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-claude-border bg-white px-2 py-1.5 text-xs font-medium text-claude-danger hover:bg-claude-danger-soft transition-all duration-300"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="mt-3 w-full rounded-lg py-1.5 text-[11px] text-claude-ink-muted transition hover:bg-claude-surface hover:text-claude-ink"
        >
          {collapsed ? "»" : "Collapse Menu"}
        </button>
      </div>
    </aside>
  );
}
