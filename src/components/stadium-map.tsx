"use client";

import { densityStatus } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { useMemo, useState } from "react";
import { Badge } from "./ui";

const SECTORS: { id: string; d: string; label: string; lx: number; ly: number }[] = [
  { id: "sector-112", d: "M 320,120 A 180,130 0 0,1 480,120 L 460,180 A 160,110 0 0,0 340,180 Z", label: "112", lx: 400, ly: 145 },
  { id: "sector-101", d: "M 480,120 A 180,130 0 0,1 640,200 L 600,240 A 160,110 0 0,0 460,180 Z", label: "101", lx: 545, ly: 175 },
  { id: "sector-102", d: "M 640,200 A 180,130 0 0,1 700,320 L 640,320 A 160,110 0 0,0 600,240 Z", label: "102", lx: 645, ly: 265 },
  { id: "sector-103", d: "M 700,320 A 180,130 0 0,1 640,440 L 600,400 A 160,110 0 0,0 640,320 Z", label: "103", lx: 645, ly: 365 },
  { id: "sector-104", d: "M 640,440 A 180,130 0 0,1 480,520 L 460,460 A 160,110 0 0,0 600,400 Z", label: "104", lx: 545, ly: 455 },
  { id: "sector-105", d: "M 480,520 A 180,130 0 0,1 320,520 L 340,460 A 160,110 0 0,0 460,460 Z", label: "105", lx: 400, ly: 485 },
  { id: "sector-106", d: "M 320,520 A 180,130 0 0,1 160,440 L 200,400 A 160,110 0 0,0 340,460 Z", label: "106", lx: 255, ly: 455 },
  { id: "sector-107", d: "M 160,440 A 180,130 0 0,1 100,320 L 160,320 A 160,110 0 0,0 200,400 Z", label: "107", lx: 155, ly: 365 },
  { id: "sector-108", d: "M 100,320 A 180,130 0 0,1 160,200 L 200,240 A 160,110 0 0,0 160,320 Z", label: "108", lx: 155, ly: 265 },
  { id: "sector-109", d: "M 160,200 A 180,130 0 0,1 320,120 L 340,180 A 160,110 0 0,0 200,240 Z", label: "109", lx: 255, ly: 175 },
  { id: "sector-110", d: "M 320,120 L 340,180 L 400,180 L 400,120 Z", label: "110", lx: 360, ly: 150 },
  { id: "sector-111", d: "M 400,120 L 400,180 L 460,180 L 480,120 Z", label: "111", lx: 440, ly: 150 },
];

const GATES = [
  { id: "A", x: 400, y: 55 },
  { id: "B", x: 720, y: 300 },
  { id: "C", x: 400, y: 545 },
  { id: "D", x: 80, y: 300 },
];

function densityClass(densityPct: number, isHighlighted: boolean) {
  const persons = (densityPct / 100) * 8 + 1;
  const status = densityStatus(persons);
  return `map-sector density-${status} ${isHighlighted ? "stroke-claude-accent stroke-[3px] fill-claude-accent-soft/30" : ""}`;
}

export function StadiumMapView() {
  const { state, stadiums, currentStadium, setVenue, tickets } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedData = useMemo(() => {
    if (!selected) return null;
    return state.sectorMap[selected] || null;
  }, [selected, state.sectorMap]);

  // Retrieve matching ticket info for mapped operations
  const activeTicket = useMemo(() => {
    if (state.role !== "fan" || !state.myTicket?.ticketNo) return null;
    return tickets.find(t => t.ticketNo.toUpperCase() === state.myTicket.ticketNo.toUpperCase()) || null;
  }, [state.role, state.myTicket, tickets]);

  // Find coordinates for route lines
  const pathCoordinates = useMemo(() => {
    if (!activeTicket) return null;
    const gate = GATES.find(g => g.id.toUpperCase() === activeTicket.assignedGate.toUpperCase());
    const sector = SECTORS.find(s => s.label === activeTicket.section);
    if (gate && sector) {
      return { x1: gate.x, y1: gate.y, x2: sector.lx, y2: sector.ly };
    }
    return null;
  }, [activeTicket]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-claude-border bg-claude-surface shadow-soft">
      {/* SVG Style animation injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes svgDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .path-route-animated {
          stroke-dasharray: 6,4;
          animation: svgDash 1.2s linear infinite;
        }
      `}} />

      {/* Header operations header */}
      {state.role === "fan" ? (
        <div className="p-3.5 bg-claude-accent-soft/20 border-b border-claude-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-claude-accent uppercase tracking-wider block">YOUR ASSIGNED STADIUM</span>
            <span className="text-sm font-serif font-bold text-claude-ink">{currentStadium?.name} ({currentStadium?.city})</span>
          </div>
          <Badge tone="success" className="text-[9px] font-bold">Ticket Active</Badge>
        </div>
      ) : (
        <div className="p-3 bg-claude-surface border-b border-claude-border flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-claude-ink-secondary">Operations Map Center</span>
          <select
            value={state.venueId}
            onChange={(e) => setVenue(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-claude-border bg-white text-claude-ink focus:outline-none focus:border-claude-accent"
          >
            {stadiums.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Crowd Map Grid Layout */}
      <div className="grid md:grid-cols-[1.5fr_1fr] items-stretch">
        {/* SVG Crowd Density Screen */}
        <div className="relative border-r border-claude-border/50">
          <svg viewBox="0 0 800 600" className="h-auto w-full" role="img" aria-label="Stadium density map">
            <rect width="800" height="600" className="map-bg" />
            <ellipse cx="400" cy="300" rx="300" ry="220" fill="none" stroke="#e8e4db" strokeWidth="36" />
            <ellipse cx="400" cy="300" rx="120" ry="80" className="map-field" />
            <text x="400" y="305" className="map-label" fill="#fff" fontSize="12" textAnchor="middle">
              PITCH
            </text>

            {SECTORS.map((s) => {
              const data = state.sectorMap[s.id];
              const density = data?.density ?? 20;
              const isUserSection = activeTicket?.section === s.label;

              return (
                <g key={s.id}>
                  <path
                    d={s.d}
                    className={densityClass(density, isUserSection)}
                    onClick={() => setSelected(s.id)}
                  />
                  <text x={s.lx} y={s.ly} className={`map-label ${isUserSection ? "fill-claude-accent font-bold" : ""}`} textAnchor="middle">
                    {s.label}
                  </text>
                  {isUserSection && (
                    <circle cx={s.lx} cy={s.ly - 14} r="3" fill="#d97757" className="animate-ping" />
                  )}
                </g>
              );
            })}

            {/* Dash route pointing to user seat */}
            {pathCoordinates && (
              <line
                x1={pathCoordinates.x1}
                y1={pathCoordinates.y1}
                x2={pathCoordinates.x2}
                y2={pathCoordinates.y2}
                stroke="#10b981"
                strokeWidth="4"
                className="path-route-animated"
              />
            )}

            {/* Gates */}
            {GATES.map((g) => {
              const isUserGate = activeTicket?.assignedGate.toUpperCase() === g.id.toUpperCase();
              return (
                <g key={g.id}>
                  <circle
                    cx={g.x}
                    cy={g.y}
                    r="15"
                    fill={isUserGate ? "#10b981" : "#d97757"}
                    className={isUserGate ? "animate-pulse" : ""}
                  />
                  <text x={g.x} y={g.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
                    {g.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Color Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl border border-claude-border bg-white/95 px-3 py-2 text-[10px] shadow-soft backdrop-blur">
            {[
              ["Safe", "bg-[#7a9bc4]"],
              ["Busy", "bg-[#c4a35a]"],
              ["Amber", "bg-[#d97757]"],
              ["Red", "bg-[#c44b4b]"],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 text-claude-ink-secondary">
                <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Mapped Operations details Panel */}
        <div className="p-4 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-claude-ink-muted mb-1">
                Stadium Specifications
              </h4>
              <div className="text-xs text-claude-ink-secondary space-y-1">
                <div><span className="font-semibold text-claude-ink">Capacity:</span> {currentStadium?.capacity.toLocaleString()}</div>
                <div><span className="font-semibold text-claude-ink">Location:</span> {currentStadium?.city}, {currentStadium?.country}</div>
                <div><span className="font-semibold text-claude-ink">Event focus:</span> {currentStadium?.matchLabel}</div>
              </div>
            </div>

            {activeTicket ? (
              <div className="rounded-xl border border-claude-accent/20 bg-claude-accent-soft/10 p-3 space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-claude-accent flex items-center gap-1.5">
                  🎟️ YOUR DIGITAL TICKET INFO
                </h4>
                <div className="text-xs space-y-1 text-claude-ink-secondary">
                  <div><span className="font-bold text-claude-ink">Ticket No:</span> {activeTicket.ticketNo}</div>
                  <div><span className="font-bold text-claude-ink">Match:</span> {activeTicket.matchLabel}</div>
                  <div><span className="font-bold text-claude-ink">Kickoff date:</span> {activeTicket.date}</div>
                  <div>
                    <span className="font-bold text-claude-ink">Seating location:</span> Section {activeTicket.section}, {activeTicket.seatNo}
                  </div>
                  <div className="pt-1.5 border-t border-claude-border mt-1">
                    <span className="font-bold text-claude-ink block text-[10px] text-claude-accent mb-0.5">🟢 AI GATEWAY ROUTING DIRECTION</span>
                    <p className="text-[11px] leading-relaxed text-claude-ink">
                      Enter through <strong className="text-claude-success">Gate {activeTicket.assignedGate}</strong> (Green path). Phased entry batch <strong className="text-claude-accent">#{activeTicket.batch}</strong> is recommended for minimal queue wait.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-claude-border/80 bg-claude-surface/30 p-3 text-[11px] text-claude-ink-muted">
                🔒 Log in as a ticket-holding Fan to overlay specific seat locations, routing directions, and assigned operations personnel.
              </div>
            )}

            {/* Stadium Staff and volunteers allocation */}
            {currentStadium && (
              <div className="space-y-3 pt-2 border-t border-claude-border">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-claude-ink-muted mb-1.5">
                    Operations Staff Allocated
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeTicket?.staff || ["John Wayne (ID: STAFF-001)", "Elena Rostova (ID: STAFF-002)"]).map((s, idx) => (
                      <Badge key={idx} tone="neutral" className="text-[9px] font-medium font-serif">
                        👤 {s.split(" ")[0]} {s.includes("(") ? s.slice(s.indexOf("(")) : ""}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-claude-ink-muted mb-1.5">
                    Wayfinding Volunteers Dispatch
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeTicket?.volunteers || ["Emma Watson", "Alex Green", "Lucas Hood", "Chloe Price"]).map((v, idx) => (
                      <Badge key={idx} tone="success" className="text-[9px] font-medium">
                        🙋‍♂️ {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selection details */}
          {selected && (
            <div className="mt-4 pt-3 border-t border-claude-border/60 text-xs">
              <div className="font-semibold text-claude-ink">{selected.replace("sector-", "Section ")} Density Details</div>
              {selectedData ? (
                <div className="mt-1 space-y-1 text-claude-ink-secondary">
                  <div>Crowd Density: <strong className="text-claude-ink">{selectedData.density}%</strong></div>
                  <div>Occupancy: <strong className="text-claude-ink">{selectedData.occupied.toLocaleString()}</strong> / {selectedData.capacity.toLocaleString()} fans</div>
                  <Badge tone={selectedData.density > 75 ? "danger" : selectedData.density > 50 ? "warning" : "success"} className="mt-1 text-[9px] font-bold">
                    {selectedData.density > 75 ? "SURGE RISK" : selectedData.density > 50 ? "BUSY" : "SAFE ZONE"}
                  </Badge>
                </div>
              ) : (
                <div className="mt-1 text-claude-ink-muted">Loading live sensor feed…</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
