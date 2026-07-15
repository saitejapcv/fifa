import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stadiums = await prisma.stadium.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(
      stadiums.map((s) => ({
        ...s,
        gates: JSON.parse(s.gates || "[]"),
        transit: JSON.parse(s.transit || "[]"),
        accessibility: JSON.parse(s.accessibility || "[]"),
        sectorsLower: JSON.parse(s.sectorsLower || "[]"),
        sectorsUpper: JSON.parse(s.sectorsUpper || "[]"),
      }))
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load stadiums" },
      { status: 500 }
    );
  }
}
