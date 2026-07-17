export type Role = "fan" | "staff" | "organizer" | "volunteer";

export type ViewId =
  | "dashboard"
  | "matches"
  | "map"
  | "incidents"
  | "gates"
  | "queues"
  | "transit"
  | "sustainability"
  | "accessibility"
  | "volunteers"
  | "settings"
  | "translate";

export type Severity = "Green" | "Amber" | "Red" | "info" | "success" | "warning" | "danger";

export interface Sector {
  id: string;
  name: string;
  density: number;
  trend: number;
}

export interface Gate {
  id: string;
  name: string;
  waitMinutes: number;
  throughputPerMin: number;
  targetThroughputPerMin: number;
}

export interface QueueItem {
  id: string;
  name: string;
  type: string;
  waitMinutes: number;
  arrivalRate: number;
  serviceRate: number;
  trend: number;
}

export interface Incident {
  id: string;
  type: string;
  location: string;
  crowdDensity: number;
  minutesToKickoff: number;
  status: string;
  createdAt: number;
  severity?: string;
  action?: string;
}

export interface TransitItem {
  id: string;
  mode: string;
  name: string;
  eta: number;
  load: string;
  note: string;
}

export interface Sustainability {
  fans: number;
  transportKgCO2e: number;
  renewableEnergyPct: number;
  gridLoadPct: number;
  waterSavedLiters: number;
  weatherDiversionPct?: number;
  wasteDiversionPct: number;
}

export interface DecisionItem {
  id: string;
  title: string;
  body: string;
  severity: string;
  confidence?: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: ResponseCard[];
  source?: string;
  createdAt: number;
}

export interface ResponseCard {
  title: string;
  rows?: string[][];
  steps?: string[];
  body?: string;
}

export interface AIResponse {
  source: string;
  summary: string;
  cards?: ResponseCard[];
  actions?: string[];
  fallbackReason?: string;
  generatedAt?: string;
}

export interface StadiumDTO {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  expandableCapacity: number;
  matchLabel: string;
  gates: string[];
  transit: string[];
  accessibility: string[];
}

export interface AppState {
  role: Role;
  venueId: string;
  matchMinute: number;
  matchState: string;
  matchPhase: string;
  selectedView: ViewId;
  sectors: Sector[];
  gates: Gate[];
  queues: QueueItem[];
  incidents: Incident[];
  transit: TransitItem[];
  sustainability: Sustainability;
  decisions: DecisionItem[];
  blockedExits: string[];
  myTicket: {
    section: string;
    assignedGate: string;
    ticketNo: string;
    batch: number;
    stadiumId?: string;
    seatNo?: string;
    matchId?: string;
    matchLabel?: string;
    date?: string;
  };
  liveMatches: Record<string, { teams: string; score: string; time: string }>;
  highContrast: boolean;
  largeText: boolean;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  sectorMap: Record<string, { density: number; occupied: number; capacity: number }>;
}

export interface StadiumRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  expandableCapacity: number;
  matchLabel: string;
  gates: string;
  transit: string;
  accessibility: string;
}

export interface TicketInfo {
  ticketNo: string;
  matchId: string;
  stadiumId: string;
  section: string;
  seatNo: string;
  assignedGate: string;
  batch: number;
  date: string;
  matchLabel: string;
  staff: string[];
  volunteers: string[];
}

