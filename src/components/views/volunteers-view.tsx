"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function VolunteersView() {
  const { state, recommendStaff } = useApp();
  const rec = StadiumAI.recommendStaffDeployment(state.sectors, state.incidents);

  return (
    <div>
      <ViewHeader
        title="Volunteer Dispatch"
        subtitle={`${rec.totalStaffRecommended} staff recommended across hotspots`}
        action={
          <Button size="sm" onClick={recommendStaff}>
            Recommend deployment
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {rec.recommendations.length === 0 && (
          <Card>
            <p className="text-sm text-claude-ink-secondary">{rec.summary}</p>
          </Card>
        )}
        {rec.recommendations.map((r, i) => (
          <Card key={`${r.location}-${i}`} delay={i * 0.05}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-claude-ink">{r.location}</div>
                <div className="text-xs text-claude-ink-muted">{r.reason}</div>
              </div>
              <Badge tone={severityTone(r.priority) as "success" | "warning" | "danger"}>
                {r.priority}
              </Badge>
            </div>
            <div className="mt-3 font-serif text-3xl text-claude-ink">
              {r.staffNeeded}
              <span className="ml-1 text-sm text-claude-ink-muted">people</span>
            </div>
            <p className="mt-2 text-sm text-claude-ink-secondary">{r.action}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
