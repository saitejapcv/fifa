"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { timeAgo } from "@/lib/utils";
import { Badge, Button, Card, KpiCard, ViewHeader } from "../ui";

export function DashboardView() {
  const { state, currentStadium, refreshDecisions } = useApp();
  const density = StadiumAI.analyzeCrowdDensity(state.sectors);
  const openIncidents = state.incidents.filter((i) => i.status !== "resolved");
  const avgWait =
    state.gates.reduce((s, g) => s + g.waitMinutes, 0) / Math.max(state.gates.length, 1);
  const match = state.liveMatches[state.venueId];

  const kpis =
    state.role === "fan"
      ? [
          {
            label: "Your gate",
            value: state.myTicket.assignedGate,
            hint: `Section ${state.myTicket.section}`,
            tone: "info" as const,
          },
          {
            label: "Best wait",
            value: `${Math.min(...state.gates.map((g) => g.waitMinutes))}m`,
            hint: "Fastest entry right now",
            tone: "success" as const,
          },
          {
            label: "Nearest queue",
            value: `${Math.min(...state.queues.map((q) => q.waitMinutes))}m`,
            hint: [...state.queues].sort((a, b) => a.waitMinutes - b.waitMinutes)[0]?.name,
            tone: "neutral" as const,
          },
          {
            label: "Crowd",
            value: density.status,
            hint: density.predictedPeak,
            tone: severityTone(density.status) as "success" | "warning" | "danger" | "info",
          },
        ]
      : state.role === "staff"
        ? [
            {
              label: "Open incidents",
              value: String(openIncidents.length),
              hint: "Need attention",
              tone: openIncidents.length > 2 ? ("danger" as const) : ("warning" as const),
            },
            {
              label: "Peak density",
              value: `${Math.max(...state.sectors.map((s) => s.density)).toFixed(1)}`,
              hint: "persons/m²",
              tone: severityTone(density.status) as "success" | "warning" | "danger" | "info",
            },
            {
              label: "Avg gate wait",
              value: `${avgWait.toFixed(0)}m`,
              hint: "Across all gates",
              tone: avgWait > 12 ? ("warning" as const) : ("success" as const),
            },
            {
              label: "Weather",
              value: `${state.weather.temperature}°`,
              hint: state.weather.condition,
              tone: "info" as const,
            },
          ]
        : [
            {
              label: "Capacity",
              value: currentStadium
                ? `${Math.round((state.sustainability.fans / currentStadium.capacity) * 100)}%`
                : "—",
              hint: `${state.sustainability.fans.toLocaleString()} fans`,
              tone: "info" as const,
            },
            {
              label: "Crowd status",
              value: density.status,
              hint: density.rebalancing,
              tone: severityTone(density.status) as "success" | "warning" | "danger" | "info",
            },
            {
              label: "Incidents",
              value: String(openIncidents.length),
              hint: "Open in command queue",
              tone: "warning" as const,
            },
            {
              label: "Sustainability",
              value: String(
                StadiumAI.calculateSustainabilityScore(state.sustainability).score
              ),
              hint: "Composite score",
              tone: "success" as const,
            },
          ];

  return (
    <div>
      <ViewHeader
        title="Operations Dashboard"
        subtitle={
          currentStadium
            ? `${currentStadium.name} · ${currentStadium.city} · ${state.matchState}`
            : state.matchState
        }
        action={
          <Button variant="ghost" size="sm" onClick={refreshDecisions}>
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} delay={i * 0.06} />
        ))}
      </div>

      {state.role === "fan" && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card delay={0.15}>
            <div className="text-xs font-medium uppercase tracking-wider text-claude-ink-muted">
              Your ticket
            </div>
            <div className="mt-2 font-serif text-2xl text-claude-ink">
              Section {state.myTicket.section}
            </div>
            <div className="mt-3 space-y-1 text-sm text-claude-ink-secondary">
              <div>Gate {state.myTicket.assignedGate} · Ticket {state.myTicket.ticketNo}</div>
              <div>Entry batch {state.myTicket.batch}</div>
            </div>
          </Card>
          <Card delay={0.2}>
            <div className="text-xs font-medium uppercase tracking-wider text-claude-ink-muted">
              Match hub
            </div>
            <div className="mt-2 font-serif text-2xl text-claude-ink">
              {match?.teams || "Match day"}
            </div>
            <div className="mt-3 space-y-1 text-sm text-claude-ink-secondary">
              <div>{match?.score}</div>
              <div>{match?.time}</div>
            </div>
          </Card>
        </div>
      )}

      <div className={`grid gap-4 ${state.role === "fan" ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
        {state.role !== "fan" && (
          <Card delay={0.18}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-claude-ink">AI decision feed</h2>
              <Badge tone="info">Live</Badge>
            </div>
            <div className="space-y-3">
              {state.decisions.slice(0, 8).map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-claude-border bg-claude-bg/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-claude-ink">{d.title}</div>
                    <Badge tone={severityTone(d.severity) as "info" | "success" | "warning" | "danger"}>
                      {d.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-claude-ink-secondary">{d.body}</p>
                  <div className="mt-2 text-[11px] text-claude-ink-muted">
                    <span suppressHydrationWarning>{timeAgo(d.createdAt)}</span>
                    {d.confidence != null && ` · ${(d.confidence * 100).toFixed(0)}% conf.`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card delay={0.24}>
          <h2 className="mb-4 font-serif text-xl text-claude-ink">Venue snapshot</h2>
          <div className="space-y-3 text-sm">
            <Row label="Venue" value={currentStadium?.name || "—"} />
            <Row label="City" value={currentStadium?.city || "—"} />
            <Row
              label="Capacity"
              value={currentStadium?.capacity.toLocaleString() || "—"}
            />
            <Row label="Phase" value={state.matchState} />
            <Row
              label="Weather"
              value={`${state.weather.temperature}°C · ${state.weather.condition}`}
            />
            <Row label="Crowd status" value={density.status} />
            <div className="pt-2">
              <div className="mb-2 text-xs font-medium text-claude-ink-muted">Sectors</div>
              <div className="space-y-2">
                {state.sectors.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-claude-ink-secondary">{s.name}</span>
                    <span className="tabular-nums text-claude-ink">
                      {s.density.toFixed(1)} /m²
                      <span className="ml-2 text-claude-ink-muted">
                        {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend).toFixed(1)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-claude-border/70 py-2 last:border-0">
      <span className="text-claude-ink-muted">{label}</span>
      <span className="font-medium text-claude-ink">{value}</span>
    </div>
  );
}
