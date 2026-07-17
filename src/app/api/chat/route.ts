import { NextRequest, NextResponse } from "next/server";

type GeminiRequest = {
  query?: string;
  system?: string;
  model?: string;
  contents?: unknown[];
};

const ALLOWED_MODELS = new Set(["gemma-4", "gemini-2.5-flash"]);
const MAX_TEXT_LENGTH = 20_000;

const isSafeText = (value: unknown) =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_TEXT_LENGTH;

export async function POST(req: NextRequest) {
  try {
    const { query, system, model, contents } = (await req.json()) as GeminiRequest;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please check your environment variables." },
        { status: 500 }
      );
    }

    if (!isSafeText(system) || (!isSafeText(query) && !Array.isArray(contents))) {
      return NextResponse.json({ error: "Invalid or oversized request." }, { status: 400 });
    }

    if (Array.isArray(contents) && JSON.stringify(contents).length > MAX_TEXT_LENGTH * 4) {
      return NextResponse.json({ error: "Request content is too large." }, { status: 413 });
    }

    const MODEL = ALLOWED_MODELS.has(model ?? "") ? model ?? "gemma-4" : "gemma-4";
    const resolvedModel = MODEL === "gemma-4" ? "gemma-4-26b-a4b-it" : MODEL;

    const body: {
      system_instruction: { parts: Array<{ text: string }> };
      contents: unknown[];
      generationConfig: Record<string, unknown>;
    } = {
      system_instruction: { parts: [{ text: system ?? "" }] },
      contents: contents ?? [{ role: "user", parts: [{ text: query ?? "" }] }],
      generationConfig: { 
        temperature: 0.4, 
        maxOutputTokens: 1024,
        ...(resolvedModel.startsWith("gemma-4") ? { thinkingConfig: { thinkingLevel: "minimal" } } : {})
      },
    };

    if (contents) {
      body.generationConfig.responseMimeType = "application/json";
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Gemini API returned error ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const payload = await res.json();
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to run Gemini query" },
      { status: 500 }
    );
  }
}
