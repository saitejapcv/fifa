import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const matchLabels: Record<string, string> = {
  metlife: "Final operations drill",
  sofi: "Group-stage evening match",
  sofistadium: "Group-stage evening match",
  azteca: "Opening match readiness",
  att: "Knockout match readiness",
  bmo: "Canada group match",
};

async function main() {
  const dataPath = path.join(process.cwd(), "legacy", "data", "stadiums.json");
  const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as {
    stadiums: Array<{
      id: string;
      name: string;
      city: string;
      country: string;
      capacity: number;
      expandable_capacity: number;
      lat: number;
      lng: number;
      gates: string[];
      transit: string[];
      accessibility: string[];
      sectors: { lower: number[]; upper: number[] };
    }>;
  };

  for (const s of raw.stadiums) {
    await prisma.stadium.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country,
        capacity: s.capacity,
        expandableCapacity: s.expandable_capacity,
        lat: s.lat,
        lng: s.lng,
        gates: JSON.stringify(s.gates),
        transit: JSON.stringify(s.transit),
        accessibility: JSON.stringify(s.accessibility),
        sectorsLower: JSON.stringify(s.sectors.lower),
        sectorsUpper: JSON.stringify(s.sectors.upper),
        matchLabel: matchLabels[s.id] || "Tournament operations",
      },
      update: {
        name: s.name,
        city: s.city,
        capacity: s.capacity,
        expandableCapacity: s.expandable_capacity,
        matchLabel: matchLabels[s.id] || "Tournament operations",
      },
    });
  }

  const seedIncidents = [
    {
      externalId: "INC-1001",
      type: "Medical",
      location: "South Stands",
      crowdDensity: 5.7,
      minutesToKickoff: 35,
      status: "open",
      severity: "Amber",
      stadiumId: "metlife",
    },
    {
      externalId: "INC-1002",
      type: "Spill",
      location: "Gate B ramp",
      crowdDensity: 3.4,
      minutesToKickoff: 35,
      status: "open",
      severity: "Green",
      stadiumId: "metlife",
    },
    {
      externalId: "INC-1003",
      type: "Security",
      location: "East Plaza",
      crowdDensity: 4.8,
      minutesToKickoff: 35,
      status: "open",
      severity: "Amber",
      stadiumId: "metlife",
    },
  ];

  for (const inc of seedIncidents) {
    const existing = await prisma.incident.findFirst({
      where: { externalId: inc.externalId },
    });
    if (!existing) {
      await prisma.incident.create({ data: inc });
    }
  }

  await prisma.setting.upsert({
    where: { key: "defaultVenue" },
    create: { key: "defaultVenue", value: "metlife" },
    update: {},
  });

  console.log(`Seeded ${raw.stadiums.length} stadiums and sample incidents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
