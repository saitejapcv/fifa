"use client";

import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function TransitView() {
  const { state, pushToast } = useApp();

  return (
    <div>
      <ViewHeader
        title="Transportation Hub"
        subtitle="Rail, shuttle, and rideshare posture"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              pushToast(
                "Transit alert sent",
                "Fans notified about platform load and shuttle staging.",
                "success"
              )
            }
          >
            Send transit alert
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {state.transit.map((t, i) => (
          <Card key={t.id} delay={i * 0.06}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-claude-ink-muted">
                {t.mode}
              </div>
              <Badge
                tone={
                  t.load === "Green"
                    ? "success"
                    : t.load === "Amber"
                      ? "warning"
                      : "danger"
                }
              >
                {t.load}
              </Badge>
            </div>
            <div className="mt-2 font-serif text-xl text-claude-ink">{t.name}</div>
            <div className="mt-3 text-sm text-claude-ink-secondary">
              ETA <span className="font-medium text-claude-ink">{t.eta} min</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-claude-ink-muted">{t.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
