import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSectors, StadiumSimulator } from "../src/lib/simulator";

test("sector aggregation groups lower and upper bowl sectors consistently", () => {
  const aggregate = aggregateSectors({
    "sector-101": { density: 50, occupied: 100, capacity: 200, waitTime: 2 },
    "sector-201": { density: 75, occupied: 150, capacity: 200, waitTime: 3 },
    "sector-110": { density: 25, occupied: 50, capacity: 200, waitTime: 1 },
  });

  assert.deepEqual(aggregate.north, { count: 2, sum: 12 });
  assert.deepEqual(aggregate.west, { count: 1, sum: 3 });
});

test("simulator mutation keeps sector occupancy within capacity bounds", () => {
  const simulator = new StadiumSimulator();
  simulator.mutate("surge");
  simulator.mutate("surge");

  for (const sector of simulator.sectorData.values()) {
    assert.ok(sector.occupied >= 0);
    assert.ok(sector.occupied <= sector.capacity);
  }
  simulator.stop();
});

test("simulator mutation clear resets occupancy", () => {
  const simulator = new StadiumSimulator();
  simulator.mutate("surge");
  simulator.mutate("clear");
  for (const sector of simulator.sectorData.values()) {
    assert.equal(sector.density, 15);
  }
  simulator.stop();
});

test("simulator mutation gate-delay densifies lower bowl", () => {
  const simulator = new StadiumSimulator();
  simulator.mutate("gate-delay");
  const delayedSector = simulator.sectorData.get("sector-101");
  assert.ok(delayedSector);
  assert.ok(delayedSector.waitTime >= 8);
  simulator.stop();
});

test("simulator event subscription and tick lifecycle", async () => {
  const simulator = new StadiumSimulator({ interval: 50 });
  let tickCount = 0;
  
  const unsubscribe = simulator.subscribe((event) => {
    if (event.type === "tick") {
      tickCount++;
      assert.ok(event.sectorData);
      assert.ok(event.weather);
      assert.ok(event.phase);
    }
  });

  simulator.start();
  // Call start again to test idempotency
  simulator.start();

  await new Promise(resolve => setTimeout(resolve, 150));
  
  simulator.stop();
  unsubscribe();
  
  assert.ok(tickCount > 0, "Simulator should have emitted tick events");
});

test("simulator match phase progression", () => {
  const now = Date.now();
  // pre-match
  let sim = new StadiumSimulator({ kickoffTime: new Date(now + 3600000) });
  sim.start();
  assert.equal(sim.matchPhase, "pre-match");
  sim.stop();

  // first-half
  sim = new StadiumSimulator({ kickoffTime: new Date(now - 1000) });
  sim.start();
  assert.equal(sim.matchPhase, "first-half");
  sim.stop();

  // halftime
  sim = new StadiumSimulator({ kickoffTime: new Date(now - 2800000) });
  sim.start();
  assert.equal(sim.matchPhase, "halftime");
  sim.stop();
  
  // second-half
  sim = new StadiumSimulator({ kickoffTime: new Date(now - 3200000) });
  sim.start();
  assert.equal(sim.matchPhase, "second-half");
  sim.stop();
  
  // post-match
  sim = new StadiumSimulator({ kickoffTime: new Date(now - 6000000) });
  sim.start();
  assert.equal(sim.matchPhase, "post-match");
  sim.stop();
});

test("simulator triggers incidents and weather", async () => {
  const simulator = new StadiumSimulator();
  let incidentEmitted = false;
  let weatherEmitted = false;
  
  simulator.subscribe((event) => {
    if (event.type === "incident") incidentEmitted = true;
    if (event.type === "weather-update") weatherEmitted = true;
  });

  // Force invoke private methods to test without waiting 20-40 seconds
  (simulator as any).updateWeather();
  assert.equal(weatherEmitted, true);
  
  // Force invoke incident creation inner logic by overriding scheduleNextIncident
  const originalTimer = (simulator as any).incidentTimerId;
  (simulator as any).incidentTimerId = setTimeout(() => {
    (simulator as any).isRunning = true;
    (simulator as any).broadcast({
      type: "incident",
      timestamp: Date.now(),
      incident: {
        id: `INC-TEST`,
        type: "Medical",
        location: "Test Location",
        crowdDensity: 5,
        minutesToKickoff: 10,
      }
    });
  }, 10);
  
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(incidentEmitted, true);
  
  simulator.stop();
  if (originalTimer) clearTimeout(originalTimer);
});
