"use client";

import { useMemo, useState, type FormEvent } from "react";
import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { timeAgo } from "@/lib/utils";
import { Badge, Button, Card, Input, Label, Select, ViewHeader } from "../ui";

export function IncidentsView() {
  const { state, addIncident, simulateRandomIncident } = useApp();
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("Medical");
  const [location, setLocation] = useState("North Concourse");
  const [density, setDensity] = useState(3.5);

  const items = useMemo(() => {
    return state.incidents
      .map((i) => {
        const triage = StadiumAI.triageIncident(i);
        return { ...i, severity: i.severity || triage.severity, action: i.action || triage.action };
      })
      .filter((i) => {
        if (filter === "all") return true;
        if (filter === "open") return i.status === "open";
        return String(i.severity).toLowerCase() === filter;
      });
  }, [state.incidents, filter]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await addIncident({
      type,
      location,
      crowdDensity: density,
      minutesToKickoff: 35,
    });
  };

  return (
    <div>
      <ViewHeader
        title="Incident Command"
        subtitle="Triage, file, and track operational alerts"
        action={
          <Button variant="danger" size="sm" onClick={simulateRandomIncident}>
            Simulate random
          </Button>
        }
      />

      <Card className="mb-5 border-claude-danger/20 bg-claude-danger-soft/30" delay={0.05}>
        <h2 className="mb-3 font-serif text-lg text-claude-danger">Report incident</h2>
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[140px] flex-1">
            <Label htmlFor="inc-type">Category</Label>
            <Select id="inc-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full">
              {["Medical", "Security", "Spill", "Lost Child", "Ticketing"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[140px] flex-1">
            <Label htmlFor="inc-loc">Location</Label>
            <Select
              id="inc-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            >
              {state.sectors.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-28">
            <Label htmlFor="inc-den">Density</Label>
            <Input
              id="inc-den"
              type="number"
              min={1}
              max={9}
              step={0.5}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
            />
          </div>
          <Button type="submit" variant="danger">
            File alert
          </Button>
        </form>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "green", "amber", "red", "open"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-claude-ink text-claude-bg"
                : "bg-claude-surface text-claude-ink-secondary hover:text-claude-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i, idx) => (
          <Card key={i.id} delay={idx * 0.04}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-claude-ink">
                  {i.type} · {i.location}
                </div>
                <div className="mt-1 text-xs text-claude-ink-muted">
                  {i.id} · <span suppressHydrationWarning>{timeAgo(i.createdAt)}</span> · density {i.crowdDensity}
                </div>
              </div>
              <Badge tone={severityTone(i.severity) as "success" | "warning" | "danger"}>
                {i.severity}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-claude-ink-secondary">{i.action}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
