"use client";

import { densityStatus } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { useMemo, useState } from "react";

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

function densityClass(densityPct: number) {
  // simulator uses 0-100; map to severity bands
  const persons = (densityPct / 100) * 8 + 1;
  const status = densityStatus(persons);
  return `map-sector density-${status}`;
}

export function StadiumMapView() {
  const { state } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedData = useMemo(() => {
    if (!selected) return null;
    return state.sectorMap[selected] || null;
  }, [selected, state.sectorMap]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-claude-border bg-claude-surface">
      <svg viewBox="0 0 800 600" className="h-auto w-full" role="img" aria-label="Stadium density map">
        <rect width="800" height="600" className="map-bg" />
        <ellipse cx="400" cy="300" rx="300" ry="220" fill="none" stroke="#e8e4db" strokeWidth="36" />
        <ellipse cx="400" cy="300" rx="120" ry="80" className="map-field" />
        <text x="400" y="305" className="map-label" fill="#fff" fontSize="12">
          PITCH
        </text>

        {SECTORS.map((s) => {
          const data = state.sectorMap[s.id];
          const density = data?.density ?? 20;
          return (
            <g key={s.id}>
              <path
                d={s.d}
                className={densityClass(density)}
                onClick={() => setSelected(s.id)}
              />
              <text x={s.lx} y={s.ly} className="map-label">
                {s.label}
              </text>
            </g>
          );
        })}

        {/* Gates */}
        {[
          { id: "A", x: 400, y: 55 },
          { id: "B", x: 720, y: 300 },
          { id: "C", x: 400, y: 545 },
          { id: "D", x: 80, y: 300 },
        ].map((g) => (
          <g key={g.id}>
            <circle cx={g.x} cy={g.y} r="14" fill="#d97757" />
            <text x={g.x} y={g.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
              {g.id}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl border border-claude-border bg-claude-card/95 px-3 py-2 text-[11px] shadow-soft backdrop-blur">
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

      {selected && (
        <div className="absolute right-3 top-3 max-w-[200px] rounded-xl border border-claude-border bg-claude-card p-3 text-xs shadow-soft">
          <div className="font-medium text-claude-ink">{selected.replace("sector-", "Section ")}</div>
          {selectedData ? (
            <div className="mt-1 space-y-0.5 text-claude-ink-secondary">
              <div>Density {selectedData.density}%</div>
              <div>
                {selectedData.occupied.toLocaleString()} / {selectedData.capacity.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-claude-ink-muted">Awaiting live feed…</div>
          )}
        </div>
      )}
    </div>
  );
}
