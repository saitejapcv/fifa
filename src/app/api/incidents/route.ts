import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_FIELD_LENGTH = 200;

function getBoundedText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, MAX_FIELD_LENGTH) || fallback;
}

function getFiniteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(incidents);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load incidents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid incident payload." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const incident = await prisma.incident.create({
      data: {
        externalId: typeof input.id === "string" ? input.id.slice(0, MAX_FIELD_LENGTH) : typeof input.externalId === "string" ? input.externalId.slice(0, MAX_FIELD_LENGTH) : null,
        type: getBoundedText(input.type, "Operational"),
        location: getBoundedText(input.location, "Unknown"),
        crowdDensity: getFiniteNumber(input.crowdDensity, 3),
        minutesToKickoff: getFiniteNumber(input.minutesToKickoff, 45),
        status: getBoundedText(input.status, "open"),
        severity: typeof input.severity === "string" ? input.severity.slice(0, MAX_FIELD_LENGTH) : null,
        action: typeof input.action === "string" ? input.action.slice(0, MAX_FIELD_LENGTH) : null,
        stadiumId: typeof input.stadiumId === "string" ? input.stadiumId.slice(0, MAX_FIELD_LENGTH) : null,
      },
    });
    return NextResponse.json(incident, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create incident" },
      { status: 500 }
    );
  }
}
