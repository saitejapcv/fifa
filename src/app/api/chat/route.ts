import { NextRequest, NextResponse } from "next/server";

// Vercel CI/CD verified connection

export async function POST(req: NextRequest) {
  try {
    const { query, system, model, contents } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please check your environment variables." },
        { status: 500 }
      );
    }

    const MODEL = model || "gemma-4";
    const resolvedModel = MODEL === "gemma-4" ? "gemma-4-26b-a4b-it" : MODEL;

    const body: any = {
      system_instruction: { parts: [{ text: system }] },
      contents: contents || [{ role: "user", parts: [{ text: query }] }],
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
