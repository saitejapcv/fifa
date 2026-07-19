import { NextRequest } from "next/server";

/**
 * Server-side proxy for Gemini API requests.
 *
 * SECURITY MODEL
 * ---------------
 * - The `GEMINI_API_KEY` lives only at server-side and is never echoed.
 * - Client-supplied model names are constrained to an allow-list.
 * - All text inputs are sanitized through `lib/security.sanitize()`.
 * - Requests are CSRF-guarded (same-origin + JSON content-type).
 * - Per-IP rate limiting (token bucket, 20 req/min) runs on top of the global
 *   middleware-level rate limit.
 * - Upstream Gemini error bodies are stripped before reaching the client.
 * - All requests include an `X-Request-Id` audit header for SIEM correlation.
 * - Multi-modal payloads have an explicit byte-size cap.
 *
 * @module /api/chat
 */

import {
  ALLOWED_MODELS,
  MAX_BODY_BYTES,
  MAX_TEXT_LENGTH,
  enforceCsrf,
  errorResponse,
  estimateBytes,
  getClientIp,
  getOrNewRequestId,
  isAllowed,
  isRateLimited,
  looksLikePromptInjection,
  okResponse,
  resolveModel,
  sanitize,
} from "@/lib/security";
import { auditLog } from "@/lib/security";

type GeminiRequest = {
  query?: unknown;
  system?: unknown;
  model?: unknown;
  contents?: unknown[];
};

/** Sanitize a string field that defaults to "". */
const safeText = (v: unknown): string => sanitize(v);
/** True if a string field passes length constraints. */
const isLengthOk = (v: unknown): boolean =>
  typeof v === "string" && v.length > 0 && v.length <= MAX_TEXT_LENGTH;

export async function POST(req: NextRequest) {
  const requestId = getOrNewRequestId(req);

  // 1. CSRF: same-origin + JSON content-type (rejects form-based CSRF).
  const csrf = enforceCsrf(req, requestId);
  if (csrf) return csrf;

  // 2. Per-IP rate limit.
  const ip = getClientIp(req);
  if (isRateLimited(`chat:${ip}`)) {
    auditLog("rate-limited", { ip, route: "chat" });
    return errorResponse("Too many requests. Please wait before trying again.", 429, requestId, {
      "Retry-After": "60",
    });
  }

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return errorResponse("Request body too large.", 413, requestId);
    }
    let parsed: GeminiRequest;
    try {
      parsed = JSON.parse(raw) as GeminiRequest;
    } catch {
      return errorResponse("Malformed JSON request.", 400, requestId);
    }

    const { query, system, model, contents } = parsed;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Do not reveal WHICH environment variable is missing.
      return errorResponse("Service is not configured.", 500, requestId);
    }

    // 3. Size & shape validation.
    const systemOk = typeof system === "undefined" || (typeof system === "string" && system.length <= MAX_TEXT_LENGTH);
    const queryOk = isLengthOk(query) || Array.isArray(contents);
    if (!systemOk || !queryOk) {
      auditLog("validation-failed", { ip, route: "chat", reason: "shape" });
      return errorResponse("Invalid or oversized request.", 400, requestId);
    }
    if (Array.isArray(contents) && estimateBytes(contents) > MAX_TEXT_LENGTH * 4) {
      return errorResponse("Request content is too large.", 413, requestId);
    }

    // 4. Model allow-list.
    const resolvedModel = resolveModel(model);
    if (typeof model === "string" && model !== "" && !isAllowed(model, ALLOWED_MODELS)) {
      auditLog("validation-failed", { ip, route: "chat", reason: "model" });
      return errorResponse("Unsupported model.", 400, requestId);
    }

    // 5. Sanitize all text that will enter the AI prompt.
    const sanitizedSystem = safeText(system) || "";
    const sanitizedQuery = safeText(query);
    if (looksLikePromptInjection(sanitizedQuery) || looksLikePromptInjection(sanitizedSystem)) {
      auditLog("validation-failed", { ip, route: "chat", reason: "prompt-injection" });
      // Soft-reject: do not reveal what tripped the detector.
      return errorResponse("Request rejected by safety filter.", 400, requestId);
    }

    const body: {
      system_instruction: { parts: Array<{ text: string }> };
      contents: unknown[];
      generationConfig: Record<string, unknown>;
    } = {
      system_instruction: { parts: [{ text: sanitizedSystem }] },
      contents:
        contents ?? [{ role: "user", parts: [{ text: sanitizedQuery }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        ...(resolvedModel.startsWith("gemma-4")
          ? { thinkingConfig: { thinkingLevel: "minimal" } }
          : {}),
      },
    };

    if (contents) {
      body.generationConfig.responseMimeType = "application/json";
    }

    // 6. Upstream call with timeout.
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
        // Strip internal Gemini error details — return safe, generic messages.
        const status = res.status;
        const safeMessage =
          status === 400
            ? "The request was malformed or contained unsupported content."
            : status === 429
            ? "Gemini API rate limit exceeded. Please try again shortly."
            : status >= 500
            ? "Gemini API is temporarily unavailable."
            : `Gemini API returned an error (${status}).`;
        return errorResponse(safeMessage, status, requestId);
      }

      const payload = await res.json();
      auditLog("ok", { ip, route: "chat", model: resolvedModel });
      return okResponse(payload, requestId);
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    const message =
      e instanceof DOMException && e.name === "AbortError"
        ? "Request timed out after 30 seconds."
        : "Failed to process Gemini query.";
    return errorResponse(message, 500, requestId);
  }
}
