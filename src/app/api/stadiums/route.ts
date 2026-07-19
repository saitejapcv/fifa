import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, getOrNewRequestId, okResponse } from "@/lib/security";

function safeJsonParse(jsonString: string): unknown[] {
  try {
    const parsed = JSON.parse(jsonString || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const requestId = getOrNewRequestId(req);
  try {
    const stadiums = await prisma.stadium.findMany({ orderBy: { name: "asc" } });
    const sanitizedStadiums = stadiums.map((s) => ({
      ...s,
      gates: safeJsonParse(s.gates),
      transit: safeJsonParse(s.transit),
      accessibility: safeJsonParse(s.accessibility),
      sectorsLower: safeJsonParse(s.sectorsLower),
      sectorsUpper: safeJsonParse(s.sectorsUpper),
    }));
    return okResponse(sanitizedStadiums, requestId);
  } catch {
    return errorResponse("Failed to load stadium database.", 500, requestId);
  }
}
