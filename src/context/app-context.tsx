"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StadiumAI } from "@/lib/ai-engine";
import { initialState } from "@/lib/initial-state";
import {
  aggregateSectors,
  StadiumSimulator,
  type SimEvent,
} from "@/lib/simulator";
import type {
  AppState,
  ChatMessage,
  Incident,
  Role,
  StadiumDTO,
  ViewId,
  TicketInfo,
} from "@/lib/types";

type Toast = {
  id: string;
  title: string;
  body?: string;
  type?: "info" | "success" | "warning" | "danger";
};

type WorldCupStadium = {
  id: string;
  name_en: string;
  city_en: string;
  country_en: string;
  capacity: number;
  region?: string;
};

type AppContextValue = {
  state: AppState;
  stadiums: StadiumDTO[];
  currentStadium: StadiumDTO | null;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  messages: ChatMessage[];
  toasts: Toast[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, body?: string, type?: Toast["type"]) => void;
  setView: (view: ViewId) => void;
  setRole: (role: Role) => void;
  setVenue: (id: string) => void;
  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  addIncident: (incident: Omit<Incident, "id" | "createdAt" | "status"> & { status?: string }) => Promise<void>;
  simulateRandomIncident: () => void;
  optimizeGates: () => void;
  predictQueues: () => void;
  recalculateSustainability: () => void;
  recommendStaff: () => void;
  mutateSimulation: (mode: "surge" | "gate-delay" | "clear") => void;
  refreshDecisions: () => void;
  sendChat: (text: string) => Promise<void>;
  chatBusy: boolean;
  currentUser: { id: string; role: Role; username?: string } | null;
  tickets: TicketInfo[];
  staffCredentials: { id: string; password: string }[];
  organizerCredentials: { id: string; username: string; password: string };
  login: (role: Role, fields: { ticketNo?: string; id?: string; username?: string; password?: string }) => boolean;
  logout: () => void;
  changeOrganizerPassword: (newPassword: string) => void;
  addStaffCredential: (id: string, password: string) => boolean;
  updateStaffCredential: (id: string, newPassword: string) => boolean;
  deleteStaffCredential: (id: string) => void;
  addTicket: (ticket: TicketInfo) => boolean;
  updateTicket: (ticket: TicketInfo) => boolean;
  deleteTicket: (ticketNo: string) => void;
};

const DEFAULT_TICKETS: TicketInfo[] = [
  {
    ticketNo: "TICKET-AZTECA",
    matchId: "1",
    stadiumId: "1",
    section: "101",
    seatNo: "Row D, Seat 14",
    assignedGate: "A",
    batch: 1,
    date: "06/11/2026",
    matchLabel: "Mexico vs. South Africa",
    staff: ["John Smith (ID: STAFF-001)", "David Miller (ID: STAFF-002)"],
    volunteers: ["Emma Watson", "Alex Green", "Lucas Hood"]
  },
  {
    ticketNo: "TICKET-SOFI",
    matchId: "19",
    stadiumId: "16",
    section: "112",
    seatNo: "Row K, Seat 24",
    assignedGate: "B",
    batch: 2,
    date: "06/16/2026",
    matchLabel: "Argentina vs. Algeria",
    staff: ["Wanda Maximoff (ID: STAFF-003)", "Vis (ID: STAFF-004)"],
    volunteers: ["Carol Danvers", "Sam Wilson", "Bucky Barnes"]
  },
  {
    ticketNo: "TICKET-METLIFE",
    matchId: "10",
    stadiumId: "11",
    section: "104",
    seatNo: "Row A, Seat 1",
    assignedGate: "C",
    batch: 3,
    date: "06/14/2026",
    matchLabel: "Germany vs. Curaçao",
    staff: ["Sarah Jenkins (ID: STAFF-005)"],
    volunteers: ["Peter Parker", "Ned Leeds", "Mary Jane"]
  },
  {
    ticketNo: "TICKET-ATT",
    matchId: "4",
    stadiumId: "4",
    section: "105",
    seatNo: "Row G, Seat 8",
    assignedGate: "D",
    batch: 1,
    date: "06/12/2026",
    matchLabel: "United States vs. Paraguay",
    staff: ["Arthur Dent (ID: STAFF-006)"],
    volunteers: ["Ford Prefect", "Zaphod Beeblebrox"]
  },
  {
    ticketNo: "TICKET-BCPLACE",
    matchId: "22",
    stadiumId: "13",
    section: "110",
    seatNo: "Row M, Seat 7",
    assignedGate: "A",
    batch: 2,
    date: "06/17/2026",
    matchLabel: "England vs. Croatia",
    staff: ["Luke Skywalker (ID: STAFF-007)", "Leia Organa (ID: STAFF-008)"],
    volunteers: ["Han Solo", "Chewbacca", "C-3PO"]
  }
];

const AppContext = createContext<AppContextValue | null>(null);

function mapStadium(raw: {
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
}): StadiumDTO {
  return {
    id: raw.id,
    name: raw.name,
    city: raw.city,
    country: raw.country,
    capacity: raw.capacity,
    expandableCapacity: raw.expandableCapacity,
    matchLabel: raw.matchLabel,
    gates: JSON.parse(raw.gates || "[]"),
    transit: JSON.parse(raw.transit || "[]"),
    accessibility: JSON.parse(raw.accessibility || "[]"),
  };
}

export function AppProvider({
  children,
  initialStadiums,
  initialIncidents,
}: {
  children: ReactNode;
  initialStadiums: StadiumDTO[];
  initialIncidents?: Incident[];
}) {
  const [state, setState] = useState<AppState>(() => ({
    ...initialState,
    incidents: initialIncidents?.length ? initialIncidents : initialState.incidents,
  }));
  const [stadiums, setStadiums] = useState<StadiumDTO[]>(initialStadiums);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello. I can help with routes, gates, queues, incidents, and transit at the venue.",
      createdAt: Date.now(),
      source: "local",
    },
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const simRef = useRef<StadiumSimulator | null>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; role: Role; username?: string } | null>(null);
  const currentUserRef = useRef(currentUser);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [staffCredentials, setStaffCredentials] = useState<{ id: string; password: string }[]>([]);
  const [organizerCredentials, setOrganizerCredentials] = useState<{ id: string; username: string; password: string }>({
    id: "ORG-001",
    username: "admin",
    password: "adminpass123",
  });

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Dynamically load the 16 real-world host stadiums from the API on mount
  useEffect(() => {
    if (stadiums.length > 1) return;

    async function fetchStadiums() {
      try {
        const res = await fetch("/api/worldcup?endpoint=stadiums");
        if (res.ok) {
          const data = await res.json();
          const response = data as { stadiums?: WorldCupStadium[] };
          if (response.stadiums && response.stadiums.length > 0) {
            const mappedStadiums = response.stadiums.map((s) => ({
              id: s.id,
              name: s.name_en,
              city: s.city_en,
              country: s.country_en,
              capacity: s.capacity,
              expandableCapacity: s.capacity,
              matchLabel: s.region ? `${s.region} region operations` : "Tournament operations",
              gates: ["A", "B", "C", "D"],
              transit: ["Train", "Bus", "Rideshare"],
              accessibility: ["Wheelchair seating", "Companion seating", "Sensory room"],
            }));
            setStadiums(mappedStadiums);
          }
        }
      } catch (e) {
        console.error("Failed to load real-world host stadiums:", e);
      }
    }
    fetchStadiums();
  }, [stadiums.length]);

  useEffect(() => {
    // Load session
    const storedSession = localStorage.getItem("fifa_session");
    let loggedInUser: { id: string; role: Role; username?: string } | null = null;
    if (storedSession) {
      try {
        loggedInUser = JSON.parse(storedSession);
        setCurrentUser(loggedInUser);
        setState(s => ({ ...s, role: loggedInUser!.role }));
      } catch (e) {
        localStorage.removeItem("fifa_session");
      }
    }

    // Load tickets
    const storedTickets = localStorage.getItem("fifa_tickets");
    let activeTicketsList = DEFAULT_TICKETS;
    if (storedTickets) {
      try {
        const parsed = JSON.parse(storedTickets);
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          activeTicketsList = DEFAULT_TICKETS;
          localStorage.setItem("fifa_tickets", JSON.stringify(DEFAULT_TICKETS));
        } else {
          activeTicketsList = parsed;
        }
      } catch (e) {
        activeTicketsList = DEFAULT_TICKETS;
        localStorage.setItem("fifa_tickets", JSON.stringify(DEFAULT_TICKETS));
      }
    } else {
      activeTicketsList = DEFAULT_TICKETS;
      localStorage.setItem("fifa_tickets", JSON.stringify(DEFAULT_TICKETS));
    }
    setTickets(activeTicketsList);

    // If logged in as fan or volunteer, sync myTicket and venueId from ticketsList
    if (loggedInUser && (loggedInUser.role === "fan" || loggedInUser.role === "volunteer")) {
      const matched = activeTicketsList.find(t => 
        loggedInUser!.role === "fan" 
          ? t.ticketNo.toUpperCase() === loggedInUser!.id.toUpperCase()
          : t.volunteers.some(v => v.toUpperCase().includes(loggedInUser!.id.toUpperCase()))
      );
      if (matched) {
        setState(s => ({
          ...s,
          venueId: matched.stadiumId,
          myTicket: {
            ticketNo: matched.ticketNo,
            section: matched.section,
            assignedGate: matched.assignedGate,
            batch: matched.batch,
            stadiumId: matched.stadiumId,
            seatNo: matched.seatNo,
            matchId: matched.matchId,
            matchLabel: matched.matchLabel,
            date: matched.date,
          }
        }));
      }
    }

    // Load staff credentials
    const storedStaff = localStorage.getItem("fifa_staff_creds");
    if (storedStaff) {
      try {
        setStaffCredentials(JSON.parse(storedStaff));
      } catch (e) {
        setStaffCredentials([{ id: "STAFF-001", password: "staffpass123" }]);
      }
    } else {
      const initialStaff = [{ id: "STAFF-001", password: "staffpass123" }];
      setStaffCredentials(initialStaff);
      localStorage.setItem("fifa_staff_creds", JSON.stringify(initialStaff));
    }

    // Load organizer credentials
    const storedOrg = localStorage.getItem("fifa_organizer_creds");
    if (storedOrg) {
      try {
        setOrganizerCredentials(JSON.parse(storedOrg));
      } catch (e) {
        // Keep default
      }
    } else {
      localStorage.setItem("fifa_organizer_creds", JSON.stringify({
        id: "ORG-001",
        username: "admin",
        password: "adminpass123",
      }));
    }
  }, []);

  const currentStadium = useMemo(
    () => stadiums.find((s) => s.id === state.venueId) || stadiums[0] || null,
    [stadiums, state.venueId]
  );

  const pushToast = useCallback(
    (title: string, body = "", type: Toast["type"] = "info") => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, body, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSimEvent = useCallback((event: SimEvent) => {
    if (event.type === "tick") {
      const agg = aggregateSectors(event.sectorData);
      setState((prev) => {
        const sectors = prev.sectors.map((sector) => {
          const a = agg[sector.id];
          if (!a || !a.count) return sector;
          const density = Number((a.sum / a.count).toFixed(1));
          const trend = Number((density - sector.density).toFixed(2));
          return { ...sector, density, trend };
        });

        // Soft-update gates and queues with noise
        const gates = prev.gates.map((g) => ({
          ...g,
          waitMinutes: Math.max(
            1,
            Math.round(g.waitMinutes + (Math.random() - 0.5) * 2)
          ),
          throughputPerMin: Math.max(
            40,
            Math.round(g.throughputPerMin + (Math.random() - 0.5) * 6)
          ),
        }));
        const queues = prev.queues.map((q) => ({
          ...q,
          waitMinutes: Math.max(
            1,
            Math.round(q.waitMinutes + (Math.random() - 0.45) * 1.5)
          ),
        }));

        const phaseLabels: Record<string, string> = {
          "pre-match": "Pre-match operations",
          "first-half": "First half live",
          halftime: "Halftime",
          "second-half": "Second half live",
          "post-match": "Post-match egress",
        };

        return {
          ...prev,
          sectors,
          gates,
          queues,
          sectorMap: event.sectorData,
          weather: event.weather,
          matchPhase: event.phase,
          matchState: phaseLabels[event.phase] || event.phase,
        };
      });
    }

    if (event.type === "incident") {
      const triage = StadiumAI.triageIncident(event.incident);
      const incident: Incident = {
        id: event.incident.id,
        type: event.incident.type,
        location: event.incident.location,
        crowdDensity: event.incident.crowdDensity,
        minutesToKickoff: event.incident.minutesToKickoff,
        status: "open",
        createdAt: Date.now(),
        severity: triage.severity,
        action: triage.action,
      };
      setState((prev) => ({
        ...prev,
        incidents: [incident, ...prev.incidents].slice(0, 40),
        decisions: [
          {
            id: `d-${Date.now()}`,
            title: `${triage.severity}: ${triage.type}`,
            body: triage.action,
            severity: triage.severity,
            confidence: triage.confidence,
            createdAt: Date.now(),
          },
          ...prev.decisions,
        ].slice(0, 30),
      }));
      
      // Do NOT push incident toasts to fans
      if (!currentUserRef.current || currentUserRef.current.role !== "fan") {
        pushToast(`${triage.severity} incident`, `${triage.type} at ${triage.location}`, "warning");
      }
    }

    if (event.type === "weather-update") {
      setState((prev) => ({ ...prev, weather: event.weather }));
    }
  }, [pushToast]);

  useEffect(() => {
    const sim = new StadiumSimulator({ interval: 5000 });
    simRef.current = sim;
    const unsub = sim.subscribe(handleSimEvent);
    sim.start();

    const syncSimulationWithVisibility = () => {
      if (document.hidden) sim.stop();
      else sim.start();
    };
    document.addEventListener("visibilitychange", syncSimulationWithVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncSimulationWithVisibility);
      unsub();
      sim.stop();
    };
  }, [handleSimEvent]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", state.highContrast);
    document.documentElement.classList.toggle("large-text", state.largeText);
  }, [state.highContrast, state.largeText]);

  const setView = (view: ViewId) => setState((s) => ({ ...s, selectedView: view }));
  const setRole = (role: Role) => {
    setState((s) => ({ ...s, role }));
    pushToast("Role updated", `Switched to ${role} mode`, "success");
  };

  const login = useCallback((role: Role, fields: { ticketNo?: string; id?: string; username?: string; password?: string }): boolean => {
    if (role === "fan") {
      const ticketVal = fields.ticketNo?.trim() || "";
      const matchedTicket = tickets.find(t => t.ticketNo.toUpperCase() === ticketVal.toUpperCase());
      if (matchedTicket) {
        const user = { id: ticketVal, role: "fan" as Role };
        setCurrentUser(user);
        localStorage.setItem("fifa_session", JSON.stringify(user));
        setState(s => ({
          ...s,
          role: "fan",
          venueId: matchedTicket.stadiumId,
          myTicket: {
            ticketNo: matchedTicket.ticketNo,
            section: matchedTicket.section,
            assignedGate: matchedTicket.assignedGate,
            batch: matchedTicket.batch,
            stadiumId: matchedTicket.stadiumId,
            seatNo: matchedTicket.seatNo,
            matchId: matchedTicket.matchId,
            matchLabel: matchedTicket.matchLabel,
            date: matchedTicket.date,
          }
        }));
        pushToast("Welcome back!", `Logged in as Fan with ticket ${ticketVal} for ${matchedTicket.matchLabel}`, "success");
        return true;
      }
    } else if (role === "volunteer") {
      const volName = fields.id?.trim() || "";
      if (!volName) return false;
      const matchedTicket = tickets.find(t => 
        t.volunteers.some(v => v.toUpperCase().includes(volName.toUpperCase()))
      );
      if (matchedTicket) {
        const user = { id: volName, role: "volunteer" as Role };
        setCurrentUser(user);
        localStorage.setItem("fifa_session", JSON.stringify(user));
        setState(s => ({
          ...s,
          role: "volunteer",
          venueId: matchedTicket.stadiumId,
          myTicket: {
            ticketNo: matchedTicket.ticketNo,
            section: matchedTicket.section,
            assignedGate: matchedTicket.assignedGate,
            batch: matchedTicket.batch,
            stadiumId: matchedTicket.stadiumId,
            seatNo: matchedTicket.seatNo,
            matchId: matchedTicket.matchId,
            matchLabel: matchedTicket.matchLabel,
            date: matchedTicket.date,
          }
        }));
        pushToast("Welcome, Volunteer!", `Logged in as Volunteer: ${volName}`, "success");
        return true;
      } else {
        const user = { id: volName, role: "volunteer" as Role };
        setCurrentUser(user);
        localStorage.setItem("fifa_session", JSON.stringify(user));
        setState(s => ({ ...s, role: "volunteer" }));
        pushToast("Welcome, Volunteer!", `Logged in as Volunteer: ${volName} (Demo Mode)`, "info");
        return true;
      }
    } else if (role === "staff") {
      const idVal = fields.id?.trim() || "";
      const passVal = fields.password || "";
      const match = staffCredentials.find(s => s.id === idVal && s.password === passVal);
      if (match) {
        const user = { id: idVal, role: "staff" as Role };
        setCurrentUser(user);
        localStorage.setItem("fifa_session", JSON.stringify(user));
        setState(s => ({ ...s, role: "staff" }));
        pushToast("Welcome!", `Logged in as Staff (${idVal})`, "success");
        return true;
      }
    } else if (role === "organizer") {
      const idVal = fields.id?.trim() || "";
      const userVal = fields.username?.trim() || "";
      const passVal = fields.password || "";
      if (
        organizerCredentials.id === idVal &&
        organizerCredentials.username === userVal &&
        organizerCredentials.password === passVal
      ) {
        const user = { id: idVal, role: "organizer" as Role, username: userVal };
        setCurrentUser(user);
        localStorage.setItem("fifa_session", JSON.stringify(user));
        setState(s => ({ ...s, role: "organizer" }));
        pushToast("Welcome, Admin!", `Logged in as Event Organizer`, "success");
        return true;
      }
    }
    return false;
  }, [tickets, staffCredentials, organizerCredentials, pushToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("fifa_session");
    pushToast("Logged out", "You have been successfully signed out.", "info");
  }, [pushToast]);

  const changeOrganizerPassword = useCallback((newPassword: string) => {
    setOrganizerCredentials(prev => {
      const updated = { ...prev, password: newPassword };
      localStorage.setItem("fifa_organizer_creds", JSON.stringify(updated));
      return updated;
    });
    pushToast("Password updated", "Organizer admin password has been changed.", "success");
  }, [pushToast]);

  const addStaffCredential = useCallback((id: string, password: string): boolean => {
    const idVal = id.trim();
    if (!idVal || !password) return false;
    let success = false;
    setStaffCredentials(prev => {
      if (prev.some(s => s.id === idVal)) {
        return prev;
      }
      const updated = [...prev, { id: idVal, password }];
      localStorage.setItem("fifa_staff_creds", JSON.stringify(updated));
      success = true;
      return updated;
    });
    if (success) {
      pushToast("Staff added", `ID ${idVal} successfully registered.`, "success");
    } else {
      pushToast("Error adding staff", `ID ${idVal} already exists.`, "danger");
    }
    return success;
  }, [pushToast]);

  const updateStaffCredential = useCallback((id: string, newPassword: string): boolean => {
    const idVal = id.trim();
    if (!idVal || !newPassword) return false;
    let success = false;
    setStaffCredentials(prev => {
      if (!prev.some(s => s.id === idVal)) {
        return prev;
      }
      const updated = prev.map(s => s.id === idVal ? { ...s, password: newPassword } : s);
      localStorage.setItem("fifa_staff_creds", JSON.stringify(updated));
      success = true;
      return updated;
    });
    if (success) {
      pushToast("Staff updated", `Password updated for ID ${idVal}.`, "success");
    }
    return success;
  }, [pushToast]);

  const deleteStaffCredential = useCallback((id: string) => {
    const idVal = id.trim();
    setStaffCredentials(prev => {
      const updated = prev.filter(s => s.id !== idVal);
      localStorage.setItem("fifa_staff_creds", JSON.stringify(updated));
      return updated;
    });
    pushToast("Staff deleted", `ID ${idVal} removed.`, "info");
  }, [pushToast]);
  const setVenue = useCallback((id: string) => {
    setState((s) => {
      // Lock venue for fan and volunteer
      if (s.role === "fan" || s.role === "volunteer") {
        return s;
      }
      return { ...s, venueId: id };
    });
    const st = stadiums.find((x) => x.id === id);
    if (st) pushToast("Venue changed", st.name, "info");
  }, [stadiums, pushToast]);

  const addTicket = useCallback((ticket: TicketInfo) => {
    let success = false;
    setTickets((prev) => {
      if (prev.some((t) => t.ticketNo.toUpperCase() === ticket.ticketNo.toUpperCase())) {
        return prev;
      }
      const updated = [...prev, ticket];
      localStorage.setItem("fifa_tickets", JSON.stringify(updated));
      success = true;
      return updated;
    });
    if (success) {
      pushToast("Ticket Registered", `Ticket ${ticket.ticketNo} added.`, "success");
    } else {
      pushToast("Error adding ticket", `Ticket ${ticket.ticketNo} already exists.`, "danger");
    }
    return success;
  }, [pushToast]);

  const updateTicket = useCallback((ticket: TicketInfo) => {
    let success = false;
    setTickets((prev) => {
      if (!prev.some((t) => t.ticketNo.toUpperCase() === ticket.ticketNo.toUpperCase())) {
        return prev;
      }
      const updated = prev.map((t) => t.ticketNo.toUpperCase() === ticket.ticketNo.toUpperCase() ? ticket : t);
      localStorage.setItem("fifa_tickets", JSON.stringify(updated));
      success = true;
      return updated;
    });
    if (success) {
      pushToast("Ticket Updated", `Ticket ${ticket.ticketNo} successfully edited.`, "success");
    }
    return success;
  }, [pushToast]);

  const deleteTicket = useCallback((ticketNo: string) => {
    setTickets((prev) => {
      const updated = prev.filter((t) => t.ticketNo.toUpperCase() !== ticketNo.toUpperCase());
      localStorage.setItem("fifa_tickets", JSON.stringify(updated));
      return updated;
    });
    pushToast("Ticket Deleted", `Ticket ${ticketNo} has been removed.`, "info");
  }, [pushToast]);

  const addIncident = async (
    data: Omit<Incident, "id" | "createdAt" | "status"> & { status?: string }
  ) => {
    const triage = StadiumAI.triageIncident(data);
    const incident: Incident = {
      id: `INC-${Date.now()}`,
      type: data.type,
      location: data.location,
      crowdDensity: data.crowdDensity,
      minutesToKickoff: data.minutesToKickoff,
      status: data.status || "open",
      createdAt: Date.now(),
      severity: triage.severity,
      action: triage.action,
    };
    setState((prev) => ({
      ...prev,
      incidents: [incident, ...prev.incidents],
      decisions: [
        {
          id: `d-${Date.now()}`,
          title: `Filed: ${triage.type}`,
          body: triage.action,
          severity: triage.severity,
          confidence: triage.confidence,
          createdAt: Date.now(),
        },
        ...prev.decisions,
      ],
    }));

    try {
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...incident,
          stadiumId: state.venueId,
          severity: triage.severity,
          action: triage.action,
        }),
      });
    } catch {
      // local state already updated
    }
    if (currentUser?.role === "fan") {
      pushToast("Report Submitted", "Thank you. Stadium operations staff have been notified.", "success");
    } else {
      pushToast("Incident filed", `${triage.severity} — ${triage.type}`, "danger");
    }
  };

  const simulateRandomIncident = () => {
    const types = ["Medical", "Security", "Spill", "Lost Child", "Ticketing"];
    const locs = state.sectors.map((s) => s.name);
    addIncident({
      type: types[Math.floor(Math.random() * types.length)],
      location: locs[Math.floor(Math.random() * locs.length)],
      crowdDensity: 2 + Math.random() * 6,
      minutesToKickoff: 20 + Math.floor(Math.random() * 40),
    });
  };

  const optimizeGates = () => {
    const plan = StadiumAI.optimizeGateFlow(state.gates);
    setState((prev) => ({
      ...prev,
      decisions: [
        {
          id: `d-${Date.now()}`,
          title: "Gate optimization",
          body: plan.summary,
          severity: plan.status,
          confidence: plan.commands[0]?.confidence,
          createdAt: Date.now(),
        },
        ...prev.decisions,
      ],
    }));
    pushToast("Gates optimized", plan.summary, "success");
  };

  const predictQueues = () => {
    const top = state.queues
      .map((q) => StadiumAI.predictQueueWait(q, state.queues))
      .sort((a, b) => b.predictedWait - a.predictedWait)[0];
    if (!top) return;
    pushToast(
      "Queue prediction",
      `${top.name}: ${top.predictedWait} min — ${top.recommendation}`,
      "info"
    );
  };

  const recalculateSustainability = () => {
    const score = StadiumAI.calculateSustainabilityScore(state.sustainability);
    pushToast("Sustainability", `Score ${score.score} — ${score.recommendation}`, "success");
  };

  const recommendStaff = () => {
    const rec = StadiumAI.recommendStaffDeployment(state.sectors, state.incidents);
    pushToast("Staff deployment", rec.summary, "info");
  };

  const mutateSimulation = (mode: "surge" | "gate-delay" | "clear") => {
    simRef.current?.mutate(mode);
    pushToast(
      "Simulation",
      mode === "clear" ? "State cleared" : mode === "surge" ? "Crowd surge applied" : "Gate delay applied",
      "warning"
    );
  };

  const refreshDecisions = () => {
    const density = StadiumAI.analyzeCrowdDensity(state.sectors);
    const gates = StadiumAI.optimizeGateFlow(state.gates);
    setState((prev) => ({
      ...prev,
      decisions: [
        {
          id: `d-${Date.now()}`,
          title: `Crowd status: ${density.status}`,
          body: density.recommendations[0] || density.rebalancing,
          severity: density.status,
          createdAt: Date.now(),
        },
        {
          id: `d-${Date.now() + 1}`,
          title: "Gate plan",
          body: gates.summary,
          severity: gates.status,
          createdAt: Date.now(),
        },
        ...prev.decisions,
      ].slice(0, 30),
    }));
    pushToast("Dashboard refreshed", "Decision feed updated from live sensors", "success");
  };

  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatBusy) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setChatBusy(true);
    try {
      const { askAssistant } = await import("@/lib/gemini");
      const response = await askAssistant(trimmed, {
        ...state,
        venueName: currentStadium?.name,
      });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: response.summary,
          cards: response.cards,
          source: response.source,
          createdAt: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: e instanceof Error ? e.message : "Something went wrong.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const value: AppContextValue = {
    state,
    stadiums,
    currentStadium,
    chatOpen,
    setChatOpen,
    messages,
    toasts,
    dismissToast,
    pushToast,
    setView,
    setRole,
    setVenue,
    setHighContrast: (v) => setState((s) => ({ ...s, highContrast: v })),
    setLargeText: (v) => setState((s) => ({ ...s, largeText: v })),
    addIncident,
    simulateRandomIncident,
    optimizeGates,
    predictQueues,
    recalculateSustainability,
    recommendStaff,
    mutateSimulation,
    refreshDecisions,
    sendChat,
    chatBusy,
    currentUser,
    tickets,
    staffCredentials,
    organizerCredentials,
    login,
    logout,
    changeOrganizerPassword,
    addStaffCredential,
    updateStaffCredential,
    deleteStaffCredential,
    addTicket,
    updateTicket,
    deleteTicket,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { mapStadium };
