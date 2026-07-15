"use client";

import { StadiumAI } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Button, Card, ViewHeader } from "../ui";

export function AccessibilityView() {
  const {
    state,
    setHighContrast,
    setLargeText,
    currentStadium,
    pushToast,
  } = useApp();

  const plan = StadiumAI.planEvacuationRoute({}, state.blockedExits);

  return (
    <div>
      <ViewHeader
        title="Accessibility Center"
        subtitle="Display preferences and step-free routing"
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-serif text-xl text-claude-ink">Display</h2>
          <ToggleRow
            title="High contrast"
            desc="Increase contrast for command-center visibility."
            checked={state.highContrast}
            onChange={setHighContrast}
          />
          <ToggleRow
            title="Large text"
            desc="Use larger operational text across the app."
            checked={state.largeText}
            onChange={setLargeText}
          />
        </Card>

        <Card delay={0.08}>
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

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-claude-border py-4 last:border-0">
      <div>
        <div className="text-sm font-medium text-claude-ink">{title}</div>
        <div className="text-xs text-claude-ink-secondary">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
          checked ? "bg-claude-accent" : "bg-claude-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ease-smooth ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
