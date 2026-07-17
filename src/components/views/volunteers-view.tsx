"use client";

import { StadiumAI, severityTone } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, ViewHeader } from "../ui";

export function VolunteersView() {
  const { state, recommendStaff, currentUser, currentStadium } = useApp();
  const rec = StadiumAI.recommendStaffDeployment(state.sectors, state.incidents);

  if (state.role === "volunteer") {
    const volName = currentUser?.id || "Volunteer";
    const assignedSection = state.myTicket?.section || "104";
    const assignedGate = state.myTicket?.assignedGate || "A";
    
    // Find active incidents in this stadium to dispatch the volunteer to
    const activeIncidents = state.incidents.filter(inc => inc.status === "open");
    const dispatchIncident = activeIncidents[0] || null;

    // Route directions generator
    const routeDirections = [
      `Enter the stadium via your assigned entrance at Gate ${assignedGate}.`,
      `Head toward the ${assignedSection.startsWith("1") ? "Lower Concourse" : "Upper Concourse"} path.`,
      dispatchIncident 
        ? `Proceed immediately to ${dispatchIncident.location} to assist staff with the reported ${dispatchIncident.type} issue.`
        : `Report to the operations supervisor at Section ${assignedSection} for deployment instructions.`
    ];

    return (
      <div className="space-y-6">
        <ViewHeader
          title={`Volunteer Hub — Welcome, ${volName}`}
          subtitle={`Rostered at ${currentStadium?.name || "Tournament Arena"} (${currentStadium?.city || "Host City"})`}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {/* Dispatch Notice Card */}
          <Card className="md:col-span-2 border-claude-accent/30 bg-claude-accent-soft/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-claude-ink flex items-center gap-2">
                <span className="animate-pulse h-2.5 w-2.5 rounded-full bg-claude-danger" />
                Active Dispatch Alert
              </h2>
              <Badge tone={dispatchIncident ? "danger" : "success"}>
                {dispatchIncident ? "Urgent Support Required" : "Standby"}
              </Badge>
            </div>

            {dispatchIncident ? (
              <div className="space-y-3">
                <p className="text-sm text-claude-ink">
                  Staff need assistance at <strong className="text-claude-accent">{dispatchIncident.location}</strong>. 
                  A <strong>{dispatchIncident.type}</strong> incident has been filed.
                </p>
                <div className="rounded-xl bg-white/70 border border-claude-border p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between text-claude-ink-secondary">
                    <span>Incident Severity:</span>
                    <Badge tone={severityTone(dispatchIncident.severity) as "info" | "success" | "warning" | "danger"}>{dispatchIncident.severity}</Badge>
                  </div>
                  <div className="flex justify-between text-claude-ink-secondary">
                    <span>Target Response Action:</span>
                    <span className="font-medium text-claude-ink">{dispatchIncident.action}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-sm text-claude-ink-secondary">
                No active incidents in your stadium sector. Please proceed to your assigned area and assist spectators with entry gating or directions.
              </div>
            )}
          </Card>

          {/* Assigned Roster Info */}
          <Card>
            <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink">Roster Details</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-claude-border pb-2">
                <span className="text-claude-ink-secondary">Role:</span>
                <span className="font-medium text-claude-ink capitalize">Operations Volunteer</span>
              </div>
              <div className="flex justify-between border-b border-claude-border pb-2">
                <span className="text-claude-ink-secondary">Assigned Arena:</span>
                <span className="font-medium text-claude-ink truncate max-w-[140px] block">{currentStadium?.name}</span>
              </div>
              <div className="flex justify-between border-b border-claude-border pb-2">
                <span className="text-claude-ink-secondary">Main Gate:</span>
                <span className="font-medium text-claude-ink">Gate {assignedGate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-claude-ink-secondary">Station Block:</span>
                <span className="font-medium text-claude-ink">Section {assignedSection}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Visual Map Route Guidance */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Text Directions */}
          <Card>
            <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink">Routing Directions</h2>
            <div className="space-y-4">
              {routeDirections.map((step, index) => (
                <div key={index} className="flex gap-3 text-xs leading-relaxed">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-claude-accent text-[10px] font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="text-claude-ink-secondary pt-0.5">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Premium Visual Map */}
          <Card className="flex flex-col items-center justify-center p-6 bg-claude-surface/30">
            <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink self-start">Interactive Dispatch Route</h2>
            
            {/* SVG Visualizer */}
            <div className="relative w-full max-w-[320px] aspect-square rounded-xl bg-white border border-claude-border/80 shadow-soft p-4 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Stadium outer ring */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                {/* Stadium inner pitch */}
                <rect x="70" y="60" width="60" height="80" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                {/* Midfield circle */}
                <circle cx="100" cy="100" r="15" fill="none" stroke="#E2E8F0" strokeWidth="2" />
                
                {/* Gate Location (Start) */}
                <g transform="translate(100, 180)">
                  <circle cx="0" cy="0" r="6" fill="#10B981" />
                  <text y="15" fontSize="8" textAnchor="middle" fontWeight="bold" className="fill-emerald-600 font-sans">
                    Gate {assignedGate}
                  </text>
                </g>

                {/* Dispatch Location (Destination) */}
                <g transform="translate(45, 60)">
                  <circle cx="0" cy="0" r="6" className="fill-rose-500 animate-ping" />
                  <circle cx="0" cy="0" r="4" fill="#EF4444" />
                  <text y="-8" fontSize="8" textAnchor="middle" fontWeight="bold" className="fill-rose-600 font-sans">
                    {dispatchIncident ? dispatchIncident.location : `Sec ${assignedSection}`}
                  </text>
                </g>

                {/* Animated Path */}
                <path
                  d="M 100,180 Q 50,150 45,60"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                  className="animate-[dash_2s_linear_infinite]"
                  style={{
                    animation: "dash 1.5s linear infinite"
                  }}
                />
              </svg>
              
              <style>{`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
              `}</style>
            </div>
            
            <div className="mt-4 flex gap-4 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Start (Gate {assignedGate})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Nav Path</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Dest ({dispatchIncident ? dispatchIncident.location : `Sec ${assignedSection}`})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ViewHeader
        title="Volunteer Dispatch"
        subtitle={`${rec.totalStaffRecommended} staff recommended across hotspots`}
        action={
          <Button size="sm" onClick={recommendStaff}>
            Recommend deployment
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {rec.recommendations.length === 0 && (
          <Card>
            <p className="text-sm text-claude-ink-secondary">{rec.summary}</p>
          </Card>
        )}
        {rec.recommendations.map((r, i) => (
          <Card key={`${r.location}-${i}`} delay={i * 0.05}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-claude-ink">{r.location}</div>
                <div className="text-xs text-claude-ink-muted">{r.reason}</div>
              </div>
              <Badge tone={severityTone(r.priority) as "success" | "warning" | "danger"}>
                {r.priority}
              </Badge>
            </div>
            <div className="mt-3 font-serif text-3xl text-claude-ink">
              {r.staffNeeded}
              <span className="ml-1 text-sm text-claude-ink-muted">people</span>
            </div>
            <p className="mt-2 text-sm text-claude-ink-secondary">{r.action}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
