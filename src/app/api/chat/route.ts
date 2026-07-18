import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for Gemini API requests.
 *
 * This route keeps the GEMINI_API_KEY server-only (never exposed to the browser),
 * enforces an allowlist of permitted models, validates input size, and applies
 * basic rate-limiting (token-bucket, 20 req/min per IP) to prevent abuse.
 *
 * @module /api/chat
 */

type GeminiRequest = {
  query?: string;
  system?: string;
  model?: string;
  contents?: unknown[];
};

/* ---------- Security: model allow-list & input bounds ---------- */
const ALLOWED_MODELS = new Set(["gemma-4", "gemini-2.5-flash"]);
const MAX_TEXT_LENGTH = 20_000;

const isSafeText = (value: unknown) =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_TEXT_LENGTH;

/* ---------- Rate-limiter: in-memory token bucket (20 req/min) ---------- */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

type TokenBucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, TokenBucket>();

/** Garbage-collect expired buckets every 5 minutes to prevent memory leaks. */
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS * 2;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, 300_000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX, lastRefill: now };
    buckets.set(ip, bucket);
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(
    RATE_LIMIT_MAX,
    bucket.tokens + (elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_MAX
  );
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return true;
  bucket.tokens -= 1;
  return false;
}

/* ---------- Efficient payload size estimation ---------- */
function estimatePayloadBytes(contents: unknown[]): number {
  let bytes = 0;
  for (const item of contents) {
    if (typeof item === "string") {
      bytes += item.length;
    } else if (typeof item === "object" && item !== null) {
      // Walk one level deep for inline_data base64 strings
      for (const val of Object.values(item as Record<string, unknown>)) {
        if (typeof val === "string") bytes += val.length;
        else if (typeof val === "object" && val !== null) {
          for (const inner of Object.values(val as Record<string, unknown>)) {
            if (typeof inner === "string") bytes += inner.length;
          }
        }
      }
    }
  }
  return bytes;
}

/* ---------- Handler ---------- */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "X-Request-Id": requestId, "Retry-After": "60" } }
      );
    }

    const { query, system, model, contents } = (await req.json()) as GeminiRequest;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please check your environment variables." },
        { status: 500, headers: { "X-Request-Id": requestId } }
      );
    }

    if (!isSafeText(system) || (!isSafeText(query) && !Array.isArray(contents))) {
      return NextResponse.json(
        { error: "Invalid or oversized request." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    if (Array.isArray(contents) && estimatePayloadBytes(contents) > MAX_TEXT_LENGTH * 4) {
      return NextResponse.json(
        { error: "Request content is too large." },
        { status: 413, headers: { "X-Request-Id": requestId } }
      );
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        // Strip internal Gemini error details — return a safe, generic message
        const status = res.status;
        const safeMessage =
          status === 400 ? "The request was malformed or contained unsupported content." :
          status === 429 ? "Gemini API rate limit exceeded. Please try again shortly." :
          status >= 500 ? "Gemini API is temporarily unavailable." :
          `Gemini API returned an error (${status}).`;

        return NextResponse.json(
          { error: safeMessage },
          { status, headers: { "X-Request-Id": requestId } }
        );
      }

      const payload = await res.json();
      return NextResponse.json(payload, {
        headers: { "X-Request-Id": requestId },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    const message =
      e instanceof DOMException && e.name === "AbortError"
        ? "Request timed out after 30 seconds."
        : "Failed to process Gemini query.";

    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
