import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json();
    const incident = await prisma.incident.create({
      data: {
        externalId: body.id || body.externalId || null,
        type: String(body.type || "Operational"),
        location: String(body.location || "Unknown"),
        crowdDensity: Number(body.crowdDensity ?? 3),
        minutesToKickoff: Number(body.minutesToKickoff ?? 45),
        status: String(body.status || "open"),
        severity: body.severity ? String(body.severity) : null,
        action: body.action ? String(body.action) : null,
        stadiumId: body.stadiumId || null,
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
