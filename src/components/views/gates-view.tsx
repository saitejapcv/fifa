"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function GatesView() {
  const { state, optimizeGates } = useApp();
  const plan = StadiumAI.optimizeGateFlow(state.gates);

  return (
    <div>
      <ViewHeader
        title="Gate Flow Optimizer"
        subtitle={plan.summary}
        action={
          <Button size="sm" onClick={optimizeGates}>
            Optimize gates
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plan.gates.map((g, i) => {
          const tone =
            g.waitMinutes >= 12 ? "danger" : g.waitMinutes >= 8 ? "warning" : "success";
          return (
            <Card key={g.id} delay={i * 0.05}>
              <div className="flex items-center justify-between">
                <div className="font-serif text-2xl text-claude-ink">{g.name}</div>
                <Badge tone={tone}>{g.waitMinutes}m</Badge>
              </div>
              <div className="mt-4 space-y-2 text-xs text-claude-ink-secondary">
                <div className="flex justify-between">
                  <span>Throughput</span>
                  <span className="tabular-nums text-claude-ink">
                    {g.throughputPerMin}/min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Target</span>
                  <span className="tabular-nums text-claude-ink">
                    {g.targetThroughputPerMin}/min
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-claude-surface">
                  <div
                    className="h-full rounded-full bg-claude-accent transition-all duration-700"
                    style={{ width: `${Math.min(100, g.utilization)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {plan.commands.length > 0 && (
        <Card>
          <h2 className="mb-3 font-serif text-xl text-claude-ink">Recommended redirects</h2>
          <div className="space-y-2">
            {plan.commands.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-claude-border bg-claude-bg/50 px-4 py-3 text-sm"
              >
                <div className="font-medium text-claude-ink">{c.command}</div>
                <div className="mt-1 text-xs text-claude-ink-secondary">{c.reason}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
