"use client";

import { StadiumAI } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Button, Card, ViewHeader } from "../ui";

export function SustainabilityView() {
  const { state, recalculateSustainability } = useApp();
  const score = StadiumAI.calculateSustainabilityScore(state.sustainability);

  return (
    <div>
      <ViewHeader
        title="Sustainability"
        subtitle="Carbon, energy, water, and waste metrics"
        action={
          <Button size="sm" onClick={recalculateSustainability}>
            Recalculate score
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="flex flex-col items-center justify-center py-10">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-claude-accent-soft">
            <div className="text-center">
              <div className="font-serif text-5xl text-claude-ink">{score.score}</div>
              <div className="text-xs text-claude-ink-muted">score</div>
            </div>
          </div>
          <p className="mt-6 max-w-xs text-center text-sm text-claude-ink-secondary">
            {score.recommendation}
          </p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Fans on site", state.sustainability.fans.toLocaleString()],
            ["Transport CO₂e", `${state.sustainability.transportKgCO2e.toLocaleString()} kg`],
            ["Carbon intensity", `${score.carbonIntensity} kg/fan`],
            ["Renewable energy", `${state.sustainability.renewableEnergyPct}%`],
            ["Grid load", `${state.sustainability.gridLoadPct}%`],
            ["Waste diversion", `${score.wasteDiversion}%`],
            ["Water saved", `${state.sustainability.waterSavedLiters.toLocaleString()} L`],
            ["Energy efficiency", `${score.energyEfficiency}`],
          ].map(([label, value], i) => (
            <Card key={label} delay={i * 0.04}>
              <div className="text-xs text-claude-ink-muted">{label}</div>
              <div className="mt-1 font-serif text-2xl text-claude-ink">{value}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
