import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StadiumAI } from "../src/lib/ai-engine";
import type { Sector, Gate, Incident, QueueItem, Sustainability } from "../src/lib/types";

describe("StadiumAI - analyzeCrowdDensity", () => {
  it("handles empty sectors", () => {
    const result = StadiumAI.analyzeCrowdDensity([]);
    assert.equal(result.status, "Green");
    assert.equal(result.alerts.length, 0);
    assert.equal(result.rebalancing.includes("No low-density relief sector"), true);
  });

  it("identifies red, amber, and green sectors accurately", () => {
    const sectors: Sector[] = [
      { id: "1", name: "RedZone", density: 7, trend: 1 },
      { id: "2", name: "AmberZone", density: 5, trend: 0 },
      { id: "3", name: "GreenZone", density: 2, trend: -1 },
    ];
    const result = StadiumAI.analyzeCrowdDensity(sectors);
    
    assert.equal(result.status, "Red");
    assert.equal(result.alerts.length, 2); // RedZone, AmberZone
    
    const redAlert = result.alerts.find(a => a.id === "1");
    assert.equal(redAlert?.severity, "Red");
    assert.equal(redAlert?.recommendation.includes("Stop inflow to RedZone"), true);

    const amberAlert = result.alerts.find(a => a.id === "2");
    assert.equal(amberAlert?.severity, "Amber");
    assert.equal(amberAlert?.recommendation.includes("Meter arrivals into AmberZone"), true);

    assert.equal(result.rebalancing.includes("Move overflow toward GreenZone"), true);
  });
});

describe("StadiumAI - optimizeGateFlow", () => {
  it("handles empty gates", () => {
    const result = StadiumAI.optimizeGateFlow([]);
    assert.equal(result.status, "Green");
    assert.equal(result.commands.length, 0);
  });

  it("generates diversion commands when overloaded gates exist", () => {
    const gates: Gate[] = [
      { id: "g1", name: "Gate A", waitMinutes: 12, throughputPerMin: 20, targetThroughputPerMin: 30 },
      { id: "g2", name: "Gate B", waitMinutes: 2, throughputPerMin: 30, targetThroughputPerMin: 30 },
    ];
    const result = StadiumAI.optimizeGateFlow(gates);
    assert.equal(result.status, "Amber");
    assert.equal(result.commands.length, 1);
    assert.equal(result.commands[0].sourceGate, "Gate A");
    assert.equal(result.commands[0].targetGate, "Gate B"); // Relief gate
  });
});

describe("StadiumAI - triageIncident", () => {
  it("handles missing incident properties", () => {
    const result = StadiumAI.triageIncident();
    assert.equal(result.severity, "Green");
    assert.equal(result.action.includes("nearest volunteer"), true);
  });

  it("identifies high-severity medical incidents", () => {
    const result = StadiumAI.triageIncident({ type: "medical", crowdDensity: 7, minutesToKickoff: 10 });
    assert.equal(result.severity, "Red");
    assert.equal(result.requiredTeams.includes("Medical"), true);
  });
  
  it("identifies medium-severity security incidents", () => {
    const result = StadiumAI.triageIncident({ type: "security", crowdDensity: 5, minutesToKickoff: 30 });
    assert.equal(result.severity, "Amber");
    assert.equal(result.action.includes("monitor density"), true);
  });
  
  it("scores various incidents according to weight (fire, spill, lost)", () => {
    assert.equal(StadiumAI.triageIncident({ type: "fire" }).score >= 4, true);
    assert.equal(StadiumAI.triageIncident({ type: "spill" }).score < 4, true);
    assert.equal(StadiumAI.triageIncident({ type: "lost" }).score < 4, true);
    assert.equal(StadiumAI.triageIncident({ type: "unknown" }).score >= 2, true);
  });
});

describe("StadiumAI - predictQueueWait", () => {
  it("handles basic queue prediction", () => {
    const q: QueueItem = { id: "q1", name: "Concession", type: "food", waitMinutes: 10, arrivalRate: 15, serviceRate: 10, trend: 1 };
    const result = StadiumAI.predictQueueWait(q, [q]);
    assert.equal(result.predictedWait > 10, true);
    assert.equal(result.alternative, null);
  });

  it("finds lower wait alternatives of same type", () => {
    const q1: QueueItem = { id: "q1", name: "Q1", type: "restroom", waitMinutes: 15, arrivalRate: 10, serviceRate: 10, trend: 0 };
    const q2: QueueItem = { id: "q2", name: "Q2", type: "restroom", waitMinutes: 2, arrivalRate: 10, serviceRate: 10, trend: 0 };
    const result = StadiumAI.predictQueueWait(q1, [q1, q2]);
    assert.equal(result.alternative?.id, "q2");
    assert.equal(result.recommendation.includes("Route fans to Q2"), true);
  });
});

describe("StadiumAI - recommendStaffDeployment", () => {
  it("recommends staff based on density", () => {
    const sectors: Sector[] = [
      { id: "1", name: "Red", density: 7, trend: 1 },
      { id: "2", name: "Amber", density: 5, trend: 0 },
    ];
    const result = StadiumAI.recommendStaffDeployment(sectors, []);
    assert.equal(result.recommendations.length, 2);
    assert.equal(result.recommendations[0].staffNeeded, 8);
    assert.equal(result.recommendations[1].staffNeeded, 4);
  });

  it("recommends staff based on open incidents", () => {
    const incidents: Incident[] = [
      { id: "1", type: "medical", status: "open", location: "Gate A", crowdDensity: 4, minutesToKickoff: 30, createdAt: Date.now() },
      { id: "2", type: "spill", status: "resolved", location: "Gate B", crowdDensity: 3, minutesToKickoff: 30, createdAt: Date.now() }, // Should be ignored
    ];
    const result = StadiumAI.recommendStaffDeployment([], incidents);
    assert.equal(result.recommendations.length, 1);
    assert.equal(result.recommendations[0].location, "Gate A");
  });
});

describe("StadiumAI - calculateSustainabilityScore", () => {
  it("scores sustainability metrics based on energy and waste", () => {
    const metrics: Sustainability = {
      fans: 1000,
      transportKgCO2e: 100,
      renewableEnergyPct: 80,
      gridLoadPct: 20,
      waterSavedLiters: 5000,
      wasteDiversionPct: 50,
    };
    const result = StadiumAI.calculateSustainabilityScore(metrics);
    assert.equal(result.score > 0, true);
    assert.equal(result.energyEfficiency, 80);
    assert.equal(result.wasteDiversion, 50);
  });

  it("handles missing sustainability metrics", () => {
    const result = StadiumAI.calculateSustainabilityScore({
      fans: 0,
      transportKgCO2e: 0,
      renewableEnergyPct: 0,
      gridLoadPct: 0,
      waterSavedLiters: 0,
      wasteDiversionPct: 0,
    });
    assert.equal(result.energyEfficiency, 30);
    assert.equal(result.wasteDiversion, 0);
  });
});

describe("StadiumAI - planEvacuationRoute", () => {
  it("generates evacuation plan for green zones", () => {
    const crowdState = { exits: [{ id: "safe", name: "Safe Exit", congestion: 1 }] };
    const result = StadiumAI.planEvacuationRoute(crowdState, []);
    assert.equal(result.exit.name, "Safe Exit");
  });
  
  it("generates safe plan avoiding incidents", () => {
    const crowdState = { exits: [{ id: "safe", name: "Safe Exit", congestion: 1 }, { id: "blocked", name: "Blocked Exit", congestion: 0 }] };
    const result = StadiumAI.planEvacuationRoute(crowdState, ["blocked"]);
    assert.equal(result.exit.id, "safe");
  });
});

describe("StadiumAI - matchFallbackResponse", () => {
  it("handles incident queries", () => {
    const result = StadiumAI.matchFallbackResponse("is there an incident", { incidents: [] });
    assert.equal(result.summary.includes("No unresolved incident"), true);
  });
  
  it("handles navigation queries", () => {
    const result = StadiumAI.matchFallbackResponse("navigate", { sectors: [] });
    assert.equal(result.summary.includes("Best route"), true);
  });
  
  it("handles queue queries", () => {
    const result = StadiumAI.matchFallbackResponse("wait time queue", { queues: [] });
    assert.equal(result.summary.includes("Lowest-wait services"), true);
  });
  
  it("handles gate queries", () => {
    const result = StadiumAI.matchFallbackResponse("gate flow", { gates: [] });
    assert.equal(result.summary.includes("target thresholds") || result.summary.includes("All gates are within target"), true);
  });
  
  it("handles transit queries", () => {
    const result = StadiumAI.matchFallbackResponse("transit bus", {});
    assert.equal(result.summary.includes("Transit guidance"), true);
  });
});
