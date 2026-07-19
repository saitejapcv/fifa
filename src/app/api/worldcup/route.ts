import { NextRequest } from "next/server";
import { errorResponse, getOrNewRequestId, okResponse } from "@/lib/security";

const ALLOWED_ENDPOINTS = new Set(["teams", "groups", "games", "stadiums"]);

export async function GET(req: NextRequest) {
  const requestId = getOrNewRequestId(req);

  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
      return errorResponse(
        "Invalid endpoint parameter. Must be 'teams', 'groups', 'games', or 'stadiums'.",
        400,
        requestId
      );
    }

    const res = await fetch(`https://worldcup26.ir/get/${endpoint}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return errorResponse(
        `World Cup API returned status ${res.status}.`,
        res.status >= 500 ? 502 : res.status,
        requestId
      );
    }

    const data = await res.json();
    return okResponse(data, requestId);
  } catch {
    return errorResponse("Failed to fetch World Cup tournament data.", 500, requestId);
  }
}
