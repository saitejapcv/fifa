"use client";

import { StadiumAI } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Button, Card, ViewHeader } from "../ui";

export function AccessibilityView() {
  const {
    state,
    currentStadium,
    pushToast,
  } = useApp();

  const plan = StadiumAI.planEvacuationRoute({}, state.blockedExits);

  return (
    <div>
      <ViewHeader
        title="Accessibility Center"
        subtitle="Step-free routing and stadium facility access"
        action={
          <Button
            size="sm"
            onClick={() =>
              pushToast(
                "Accessible route",
                `Use ${plan.exit.name}. ${plan.instructions[1]}`,
                "success"
              )
            }
          >
            Plan accessible route
          </Button>
        }
      />

      <div className="mx-auto max-w-xl">
        <Card>
          <h2 className="mb-3 font-serif text-xl text-claude-ink">Venue facilities</h2>
          <ul className="space-y-2">
            {(currentStadium?.accessibility || []).map((item) => (
              <li
                key={item}
                className="rounded-xl border border-claude-border bg-claude-bg/50 px-3 py-2 text-sm text-claude-ink-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl bg-claude-accent-soft/50 p-3 text-sm text-claude-ink">
            Recommended exit: <strong>{plan.exit.name}</strong>
            <p className="mt-1 text-xs text-claude-ink-secondary">
              {plan.instructions.join(" ")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
