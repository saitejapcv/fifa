"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function QueuesView() {
  const { state, predictQueues } = useApp();
  const predictions = state.queues.map((q) =>
    StadiumAI.predictQueueWait(q, state.queues)
  );

  return (
    <div>
      <ViewHeader
        title="Queues & Services"
        subtitle="Live waits with short-horizon predictions"
        action={
          <Button size="sm" onClick={predictQueues}>
            Predict waits
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {predictions.map((q, i) => (
          <Card key={q.id} delay={i * 0.05}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-claude-ink">{q.name}</div>
                <div className="text-xs text-claude-ink-muted">{q.type}</div>
              </div>
              <Badge tone={severityTone(q.severity) as "success" | "warning" | "danger"}>
                {q.severity}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-claude-ink-muted">Now</div>
                <div className="font-serif text-2xl text-claude-ink">{q.currentWait}m</div>
              </div>
              <div>
                <div className="text-[11px] text-claude-ink-muted">Predicted</div>
                <div className="font-serif text-2xl text-claude-ink">{q.predictedWait}m</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-claude-ink-secondary">
              {q.recommendation}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
