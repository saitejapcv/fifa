"use client";

import { useApp } from "@/context/app-context";
import { Badge, Button, Select } from "./ui";

export function Header({ onMenu }: { onMenu: () => void }) {
  const { state, stadiums, setVenue, setChatOpen, chatOpen, setView } = useApp();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-claude-border bg-claude-bg/85 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl border border-claude-border bg-claude-card px-3 py-2 text-xs font-medium text-claude-ink-secondary transition hover:border-claude-border-strong md:hidden"
        >
          Menu
        </button>
        <div className="hidden font-serif text-lg text-claude-ink sm:block">
          {state.matchState}
        </div>
        <Badge tone="neutral" className="hidden sm:inline-flex">
          {state.matchPhase}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={state.venueId}
          onChange={(e) => setVenue(e.target.value)}
          aria-label="Venue"
          className="max-w-[180px] md:max-w-none"
        >
          {stadiums.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Badge tone="info" className="hidden capitalize sm:inline-flex">
          {state.role} mode
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={chatOpen ? "soft" : "primary"}
          size="sm"
          onClick={() => setChatOpen(!chatOpen)}
        >
          AI Assistant
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => setView("settings")}
        >
          Settings
        </Button>
      </div>
    </header>
  );
}
