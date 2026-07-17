import assert from "node:assert/strict";
import test from "node:test";
import { StadiumAI, densityStatus } from "../src/lib/ai-engine";

test("crowd analysis escalates red-density sectors", () => {
  const result = StadiumAI.analyzeCrowdDensity([
    { id: "north", name: "North Stand", density: 6.5, trend: 0.4 },
    { id: "east", name: "East Stand", density: 2.1, trend: -0.1 },
  ]);

  assert.equal(result.status, "Red");
  assert.equal(result.alerts[0]?.severity, "Red");
  assert.match(result.recommendations[0] ?? "", /Stop inflow/);
});

test("gate optimization proposes a bounded diversion", () => {
  const plan = StadiumAI.optimizeGateFlow([
    { id: "A", name: "Gate A", waitMinutes: 15, throughputPerMin: 50, targetThroughputPerMin: 100 },
    { id: "B", name: "Gate B", waitMinutes: 4, throughputPerMin: 100, targetThroughputPerMin: 100 },
  ]);

  assert.equal(plan.status, "Amber");
  assert.equal(plan.commands.length, 1);
  assert.match(plan.commands[0]?.command ?? "", /Redirect (?:[1-3]\d|40)%/);
});

test("incident triage prioritizes high-density medical events near kickoff", () => {
  const triage = StadiumAI.triageIncident({
    type: "Medical",
    location: "Gate B",
    crowdDensity: 6.5,
    minutesToKickoff: 10,
  });

  assert.equal(triage.severity, "Red");
  assert.equal(triage.slaMinutes, 2);
  assert.ok(triage.requiredTeams.includes("Medical"));
});

test("queue recommendations choose a materially faster equivalent service", () => {
  const queue = { id: "food-a", name: "Food A", type: "food", waitMinutes: 10, arrivalRate: 8, serviceRate: 4, trend: 1 };
  const result = StadiumAI.predictQueueWait(queue, [
    queue,
    { id: "food-b", name: "Food B", type: "food", waitMinutes: 3, arrivalRate: 3, serviceRate: 5, trend: 0 },
  ]);

  assert.equal(result.severity, "Red");
  assert.equal(result.alternative?.id, "food-b");
});

test("evacuation planning remains safe when every exit is unavailable", () => {
  const plan = StadiumAI.planEvacuationRoute({ exits: [] }, []);

  assert.equal(plan.exit.id, "default");
  assert.match(plan.instructions[1] ?? "", /nearest staffed exit/);
});

test("density status has stable threshold boundaries", () => {
  assert.equal(densityStatus(3), "safe");
  assert.equal(densityStatus(3.1), "moderate");
  assert.equal(densityStatus(4.1), "crowded");
  assert.equal(densityStatus(6.1), "critical");
});
