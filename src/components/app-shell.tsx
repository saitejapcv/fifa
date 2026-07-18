"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ComponentType } from "react";
import { useApp } from "@/context/app-context";
import type { ViewId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { ToastHost } from "./toast";
import { LoginPage } from "./login-page";
import { AccessibilityView } from "./views/accessibility-view";
import { DashboardView } from "./views/dashboard-view";
import { GatesView } from "./views/gates-view";
import { IncidentsView } from "./views/incidents-view";
import { MapView } from "./views/map-view";
import { QueuesView } from "./views/queues-view";
import { SettingsView } from "./views/settings-view";
import { SustainabilityView } from "./views/sustainability-view";
import { TransitView } from "./views/transit-view";
import { VolunteersView } from "./views/volunteers-view";
import { MatchesView } from "./views/matches-view";
import { TranslateView } from "./views/translate-view";

const views: Record<ViewId, ComponentType> = {
  dashboard: DashboardView,
  matches: MatchesView,
  map: MapView,
  incidents: IncidentsView,
  gates: GatesView,
  queues: QueuesView,
  transit: TransitView,
  sustainability: SustainabilityView,
  accessibility: AccessibilityView,
  volunteers: VolunteersView,
  translate: TranslateView,
  settings: SettingsView,
};

const mobileNav: { id: ViewId; label: string }[] = [
  { id: "dashboard", label: "Dash" },
  { id: "map", label: "Map" },
  { id: "incidents", label: "Ops" },
  { id: "queues", label: "Queues" },
  { id: "settings", label: "More" },
];

export function AppShell() {
  const { state, setView, currentUser, isInitialized } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const Active = views[state.selectedView] || DashboardView;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-claude-bg text-claude-ink">
        <LoginPage isInitialized={isInitialized} />
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-claude-bg text-claude-ink">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-claude-ink/20"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[240px]">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-500 ease-smooth",
          collapsed ? "md:pl-[72px]" : "md:pl-[240px]"
        )}
      >
        <Header onMenu={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.selectedView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Active />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-claude-border bg-claude-card/95 px-2 py-2 backdrop-blur md:hidden" aria-label="Mobile navigation">
        {mobileNav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition",
              state.selectedView === item.id
                ? "text-claude-accent"
                : "text-claude-ink-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ChatPanel />
      <ToastHost />
    </div>
  );
}
