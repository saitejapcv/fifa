import { AppShell } from "@/components/app-shell";
import { AppProvider, mapStadium } from "@/context/app-context";
import { prisma } from "@/lib/prisma";
import type { Incident } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadData() {
  try {
    const [stadiums, incidents] = await Promise.all([
      prisma.stadium.findMany({ orderBy: { name: "asc" } }),
      prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    return {
      stadiums: stadiums.map(mapStadium),
      incidents: incidents.map(
        (i): Incident => ({
          id: i.externalId || i.id,
          type: i.type,
          location: i.location,
          crowdDensity: i.crowdDensity,
          minutesToKickoff: i.minutesToKickoff,
          status: i.status,
          createdAt: i.createdAt.getTime(),
          severity: i.severity || undefined,
          action: i.action || undefined,
        })
      ),
    };
  } catch {
    // DB not ready yet — fall back to empty and client defaults
    return { stadiums: [], incidents: [] };
  }
}

export default async function HomePage() {
  const { stadiums, incidents } = await loadData();

  // Ensure a usable venue list even before seed
  const fallbackStadiums =
    stadiums.length > 0
      ? stadiums
      : [
          {
            id: "metlife",
            name: "MetLife Stadium",
            city: "East Rutherford",
            country: "USA",
            capacity: 82500,
            expandableCapacity: 82500,
            matchLabel: "Final operations drill",
            gates: ["A", "B", "C", "D", "E", "F"],
            transit: ["Rail", "Bus", "Rideshare"],
            accessibility: ["Wheelchair seating", "Companion seating"],
          },
        ];

  return (
    <AppProvider initialStadiums={fallbackStadiums} initialIncidents={incidents}>
      <AppShell />
    </AppProvider>
  );
}
