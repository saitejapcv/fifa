"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { StadiumMapView } from "../stadium-map";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function MapView() {
  const { state, pushToast } = useApp();
  const analysis = StadiumAI.analyzeCrowdDensity(state.sectors);

  return (
    <div>
      <ViewHeader
        title="Stadium Crowd Map"
        subtitle="Live density by sector with AI reroute guidance"
        action={
          <Button
            size="sm"
            onClick={() =>
              pushToast("Reroute plan", analysis.rebalancing, "info")
            }
          >
            Run reroute plan
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <StadiumMapView />
        <Card>
          <h2 className="mb-3 font-serif text-xl text-claude-ink">Map insights</h2>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-claude-ink-muted">Overall</span>
            <Badge tone={severityTone(analysis.status) as "success" | "warning" | "danger"}>
              {analysis.status}
            </Badge>
          </div>
          <p className="mb-4 text-sm text-claude-ink-secondary">{analysis.rebalancing}</p>
          <div className="space-y-2">
            {analysis.sectors.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-claude-border bg-claude-bg/50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-claude-ink">{s.name}</span>
                  <Badge tone={severityTone(s.severity) as "success" | "warning" | "danger"}>
                    {s.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-claude-ink-secondary">{s.recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
