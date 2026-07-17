import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint || !["teams", "groups", "games", "stadiums"].includes(endpoint)) {
      return NextResponse.json(
        { error: "Invalid endpoint parameter. Must be 'teams', 'groups', 'games', or 'stadiums'." },
        { status: 400 }
      );
    }

    const res = await fetch(`https://worldcup26.ir/get/${endpoint}`, {
      // Tournament data changes infrequently; cache upstream responses to reduce latency and API usage.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `World Cup API returned error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch World Cup data" },
      { status: 500 }
    );
  }
}
