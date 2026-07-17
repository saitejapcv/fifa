"use client";

import { useMemo } from "react";
import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function GatesView() {
  const { state, optimizeGates, pushToast } = useApp();
  const plan = StadiumAI.optimizeGateFlow(state.gates);

  // Find best gate dynamically
  const bestGate = useMemo(() => {
    return [...state.gates].sort((a, b) => a.waitMinutes - b.waitMinutes)[0] || null;
  }, [state.gates]);

  const handleFindBestGate = () => {
    if (bestGate) {
      pushToast(
        "Optimal Gate Located",
        `Gate ${bestGate.id} is the fastest entry point right now with just a ${bestGate.waitMinutes}m wait.`,
        "success"
      );
    }
  };

  if (state.role === "fan") {
    const myAssignedGateId = state.myTicket?.assignedGate?.toUpperCase();
    const assignedGate = state.gates.find((g) => g.id.toUpperCase() === myAssignedGateId);
    
    // Check if another gate is significantly faster
    const shouldReroute = assignedGate && bestGate && (assignedGate.waitMinutes - bestGate.waitMinutes > 5);

    return (
      <div className="space-y-6">
        <ViewHeader
          title="Optimal Gate Entry Guide"
          subtitle="Real-time gate wait times and entry route suggestions"
          action={
            <Button size="sm" onClick={handleFindBestGate}>
              Find Best Gate
            </Button>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plan.gates.map((g, i) => {
            const isAssigned = g.id.toUpperCase() === myAssignedGateId;
            const isFastest = bestGate && g.id === bestGate.id;
            const tone = g.waitMinutes >= 12 ? "danger" : g.waitMinutes >= 8 ? "warning" : "success";

            return (
              <Card key={g.id} delay={i * 0.05} className={isAssigned ? "border-claude-accent/45 bg-claude-accent-soft/10 shadow-lift" : ""}>
                <div className="flex items-center justify-between">
                  <div className="font-serif text-2xl text-claude-ink flex items-center gap-1.5">
                    {g.name}
                    {isAssigned && <span className="text-[10px] text-claude-accent font-semibold bg-claude-accent-soft/30 px-1.5 py-0.5 rounded-md">Assigned</span>}
                  </div>
                  <Badge tone={tone}>{g.waitMinutes}m</Badge>
                </div>
                <div className="mt-4 space-y-2 text-xs text-claude-ink-secondary">
                  <div className="flex justify-between">
                    <span>Flow Rate</span>
                    <span className="tabular-nums text-claude-ink">{g.throughputPerMin}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity Status</span>
                    <span className="tabular-nums text-claude-ink">{g.utilization.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {isAssigned && <Badge tone="info" className="text-[9px]">Your Ticket Gate</Badge>}
                    {isFastest && <Badge tone="success" className="text-[9px]">Fastest Entry</Badge>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <h2 className="mb-3 font-serif text-xl text-claude-ink">Smart Routing Recommendation</h2>
          {shouldReroute && assignedGate && bestGate ? (
            <div className="rounded-xl border border-claude-warning/20 bg-claude-warning-soft/10 p-4">
              <h3 className="font-semibold text-claude-warning text-sm mb-1">⚠️ Alternate Entrance Recommended</h3>
              <p className="text-xs text-claude-ink-secondary leading-relaxed">
                Your ticket lists <strong>Gate {assignedGate.id}</strong> (wait time: {assignedGate.waitMinutes}m). However, <strong>Gate {bestGate.id}</strong> is currently much clearer with a wait time of only {bestGate.waitMinutes}m. We recommend taking the route via Gate {bestGate.id} to bypass security lines and save roughly {assignedGate.waitMinutes - bestGate.waitMinutes} minutes.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-claude-success/20 bg-claude-success-soft/10 p-4">
              <h3 className="font-semibold text-claude-success text-sm mb-1">✅ Optimal Route Confirmed</h3>
              <p className="text-xs text-claude-ink-secondary leading-relaxed">
                Your assigned entrance at <strong>Gate {myAssignedGateId || "A"}</strong> is currently the best route available. Please proceed to Gate {myAssignedGateId || "A"} for direct entry to your seats.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

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
