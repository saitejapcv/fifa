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
