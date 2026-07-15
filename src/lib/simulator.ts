export type SimSector = {
  density: number;
  occupied: number;
  capacity: number;
  waitTime: number;
};

export type SimEvent =
  | {
      type: "tick";
      phase: string;
      timestamp: number;
      sectorData: Record<string, SimSector>;
      weather: WeatherState;
    }
  | {
      type: "incident";
      incident: {
        id: string;
        type: string;
        location: string;
        crowdDensity: number;
        minutesToKickoff: number;
      };
      timestamp: number;
    }
  | { type: "weather-update"; weather: WeatherState; timestamp: number };

export type WeatherState = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
};

type Listener = (event: SimEvent) => void;

const INCIDENT_TYPES = ["Medical", "Spill", "Security", "Lost Child", "Ticketing"];
const LOCATIONS = [
  "North Concourse",
  "East Plaza",
  "South Stands",
  "West Gate Hall",
  "Lower Bowl",
  "Gate B ramp",
];

export class StadiumSimulator {
  interval: number;
  matchPhase = "pre-match";
  kickoffTime: Date;
  sectorData = new Map<string, SimSector>();
  weather: WeatherState = {
    temperature: 22,
    humidity: 65,
    windSpeed: 8,
    condition: "sunny",
  };
  private listeners = new Set<Listener>();
  private isRunning = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private incidentTimerId: ReturnType<typeof setTimeout> | null = null;
  private weatherTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(options: { interval?: number; kickoffTime?: Date } = {}) {
    this.interval = options.interval || 5000;
    this.kickoffTime = options.kickoffTime || new Date(Date.now() + 3600000);
    this.initializeSectors();
  }

  private initializeSectors() {
    const sectors: string[] = [];
    for (let i = 101; i <= 112; i++) sectors.push(`sector-${i}`);
    for (let i = 201; i <= 212; i++) sectors.push(`sector-${i}`);
    sectors.forEach((id) => {
      this.sectorData.set(id, {
        density: Math.floor(Math.random() * 30),
        occupied: Math.floor(Math.random() * 1500),
        capacity: 5000,
        waitTime: 0,
      });
    });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private broadcast(event: SimEvent) {
    this.listeners.forEach((l) => l(event));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerId = setInterval(() => this.tick(), this.interval);
    this.scheduleNextIncident();
    this.weatherTimerId = setInterval(() => this.updateWeather(), 30000);
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) clearInterval(this.timerId);
    if (this.incidentTimerId) clearTimeout(this.incidentTimerId);
    if (this.weatherTimerId) clearInterval(this.weatherTimerId);
  }

  private tick() {
    this.updateMatchPhase();
    this.updateFanFlow();
    this.broadcast({
      type: "tick",
      phase: this.matchPhase,
      timestamp: Date.now(),
      sectorData: Object.fromEntries(this.sectorData),
      weather: { ...this.weather },
    });
  }

  private updateMatchPhase() {
    const elapsed = Date.now() - this.kickoffTime.getTime();
    if (elapsed < 0) this.matchPhase = "pre-match";
    else if (elapsed < 2700000) this.matchPhase = "first-half";
    else if (elapsed < 3150000) this.matchPhase = "halftime";
    else if (elapsed < 5850000) this.matchPhase = "second-half";
    else this.matchPhase = "post-match";
  }

  private updateFanFlow() {
    const sectors = Array.from(this.sectorData.keys());
    const intensity =
      this.matchPhase === "pre-match"
        ? Math.max(
            0.2,
            Math.min(1, 1 - (this.kickoffTime.getTime() - Date.now()) / 2700000)
          )
        : this.matchPhase === "halftime"
          ? 0.9
          : this.matchPhase === "post-match"
            ? 0.7
            : 0.35;

    sectors.forEach((id) => {
      const data = this.sectorData.get(id)!;
      const delta = Math.floor((Math.random() - 0.35) * 80 * intensity);
      data.occupied = Math.max(0, Math.min(data.capacity, data.occupied + delta));
      data.density = Math.floor((data.occupied / data.capacity) * 100);
      data.waitTime = Math.max(0, Math.round(data.density / 8 + Math.random() * 3));
    });
  }

  private scheduleNextIncident() {
    const delay = 20000 + Math.random() * 40000;
    this.incidentTimerId = setTimeout(() => {
      if (!this.isRunning) return;
      const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const densities = Array.from(this.sectorData.values()).map((s) => s.density / 15);
      const avg = densities.reduce((a, b) => a + b, 0) / Math.max(densities.length, 1);
      this.broadcast({
        type: "incident",
        timestamp: Date.now(),
        incident: {
          id: `INC-${Date.now()}`,
          type,
          location,
          crowdDensity: round1(Math.max(1.5, Math.min(8.5, avg + Math.random() * 2))),
          minutesToKickoff: Math.max(
            0,
            Math.round((this.kickoffTime.getTime() - Date.now()) / 60000)
          ),
        },
      });
      this.scheduleNextIncident();
    }, delay);
  }

  private updateWeather() {
    this.weather = {
      temperature: round1(20 + Math.random() * 8),
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: round1(4 + Math.random() * 10),
      condition: ["sunny", "partly cloudy", "overcast", "breezy"][
        Math.floor(Math.random() * 4)
      ],
    };
    this.broadcast({
      type: "weather-update",
      weather: { ...this.weather },
      timestamp: Date.now(),
    });
  }

  mutate(mode: "surge" | "gate-delay" | "clear") {
    if (mode === "clear") {
      this.sectorData.forEach((data) => {
        data.occupied = Math.floor(data.capacity * 0.15);
        data.density = 15;
        data.waitTime = 1;
      });
      return;
    }
    if (mode === "surge") {
      this.sectorData.forEach((data) => {
        data.occupied = Math.min(data.capacity, data.occupied + 1200);
        data.density = Math.floor((data.occupied / data.capacity) * 100);
      });
      return;
    }
    // gate-delay: densify lower bowl entries
    ["sector-101", "sector-102", "sector-103", "sector-112"].forEach((id) => {
      const data = this.sectorData.get(id);
      if (data) {
        data.occupied = Math.min(data.capacity, data.occupied + 800);
        data.density = Math.floor((data.occupied / data.capacity) * 100);
        data.waitTime += 8;
      }
    });
  }
}

function round1(n: number) {
  return Number(n.toFixed(1));
}

export function aggregateSectors(sectorMapData: Record<string, SimSector>) {
  const aggregation: Record<string, { count: number; sum: number }> = {
    north: { count: 0, sum: 0 },
    east: { count: 0, sum: 0 },
    south: { count: 0, sum: 0 },
    west: { count: 0, sum: 0 },
    field: { count: 0, sum: 0 },
  };

  Object.entries(sectorMapData).forEach(([id, data]) => {
    const num = parseInt(id.replace("sector-", ""), 10) || 0;
    let region = "field";
    if ((num >= 101 && num <= 103) || (num >= 201 && num <= 203)) region = "north";
    else if ((num >= 104 && num <= 106) || (num >= 204 && num <= 206)) region = "east";
    else if ((num >= 107 && num <= 109) || (num >= 207 && num <= 209)) region = "south";
    else if ((num >= 110 && num <= 112) || (num >= 210 && num <= 212)) region = "west";

    aggregation[region].count++;
    // Convert 0-100 density to ~1-9 persons/m2 scale used by dashboard
    aggregation[region].sum += (data.density / 100) * 8 + 1;
  });

  return aggregation;
}
