import { NextRequest, NextResponse } from "next/server";

/**
 * Centralized Security Library for FIFA 2026 Smart Stadium AI Operations Center.
 *
 * Provides robust, production-grade security utilities:
 * - Input validation and bounded type checks
 * - Multi-layer text sanitization (HTML encoding, Unicode NFKC normalization, zero-width stripping, control character removal)
 * - LLM Prompt Injection & System Override Defense
 * - Token-bucket Rate Limiter with automatic memory garbage collection
 * - CSRF & Origin Verification
 * - Audit logging & standardized security response wrappers
 *
 * @module security
 */

/* ============================================================================
 * 1. Constants & Configurations
 * ============================================================================ */

export const ALLOWED_MODELS = new Set(["gemma-4", "gemma-4-26b-a4b-it", "gemini-2.5-flash"]);
export const DEFAULT_MODEL = "gemma-4";
export const MAX_TEXT_LENGTH = 20_000;
export const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB limit

/* ============================================================================
 * 2. Text Sanitization & Prompt Injection Defense
 * ============================================================================ */

/** Known prompt injection and system instruction override patterns */
const PROMPT_INJECTION_PATTERNS = [
  /\[SYSTEM\s*INSTRUCTION\]/gi,
  /\[SYSTEM\s*PROMPT\]/gi,
  /\[OVERRIDE\s*SYSTEM\]/gi,
  /IGNORE\s+(ALL\s+)?PREVIOUS\s+INSTRUCTIONS/gi,
  /DISREGARD\s+(ALL\s+)?PREVIOUS\s+PROMPTS/gi,
  /YOU\s+ARE\s+NOW\s+A/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
];

/**
 * Checks if string contains aggressive prompt injection markers.
 */
export function looksLikePromptInjection(text: unknown): boolean {
  if (typeof text !== "string" || !text.trim()) return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitizes input strings against:
 * 1. Unicode tricks (NFKC normalization, stripping zero-width spaces, bidi overrides)
 * 2. Invisible ASCII control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
 * 3. HTML special characters (<, >, &, ", ')
 * 4. LLM Prompt Injection markers
 *
 * @param input Raw text input
 * @returns Sanitized, safe string
 */
export function sanitize(input: unknown): string {
  if (typeof input !== "string") return "";

  // 1. Normalize Unicode (NFKC) to collapse homoglyphs and compatibility chars
  let clean = input.normalize("NFKC");

  // 2. Strip zero-width spaces, directional overrides, and non-printable control chars
  //    Preserves normal whitespace, line breaks (\n, \r), and tabs (\t)
  clean = clean
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Neutralize Prompt Injection / System Override attack strings
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[Filtered Keyword]");
  }

  // 4. HTML entity encode sensitive characters to prevent XSS
  return clean
    .replace(/[<>&"']/g, (char) => {
      const map: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char] || char;
    })
    .trim();
}

export const sanitizeText = sanitize;

/* ============================================================================
 * 3. Input Bounds & Type Validation
 * ============================================================================ */

/** Checks if a value is a non-empty string within length bounds. */
export function isSafeString(
  value: unknown,
  minLength = 1,
  maxLength = MAX_TEXT_LENGTH
): value is string {
  return (
    typeof value === "string" &&
    value.length >= minLength &&
    value.length <= maxLength
  );
}

/** Checks if a value is undefined, null, or a safe string up to maxLength. */
export function isOptionalSafeString(
  value: unknown,
  maxLength = MAX_TEXT_LENGTH
): boolean {
  if (value === undefined || value === null) return true;
  return typeof value === "string" && value.length <= maxLength;
}

/** Validates and bounds numeric inputs within safe min/max ranges. */
export function validateBoundedNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

/** Validates string against an allowlist of valid enum values. */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T
): T {
  if (typeof value === "string" && (allowedValues as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export function isAllowed(model: string, allowlist: Set<string>): boolean {
  return allowlist.has(model);
}

export function resolveModel(model: unknown): string {
  const modelStr = typeof model === "string" && ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
  return modelStr === "gemma-4" ? "gemma-4-26b-a4b-it" : modelStr;
}

/** Efficiently estimates byte size of JSON content items. */
export function estimateBytes(contents: unknown[]): number {
  let bytes = 0;
  for (const item of contents) {
    if (typeof item === "string") {
      bytes += item.length;
    } else if (typeof item === "object" && item !== null) {
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

/* ============================================================================
 * 4. Rate Limiter (In-Memory Token Bucket with Automatic Cleanup)
 * ============================================================================ */

type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private gcInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private windowMs = 60_000, private defaultMax = 30) {
    if (typeof setInterval !== "undefined") {
      this.gcInterval = setInterval(() => this.cleanup(), 300_000);
      if (this.gcInterval?.unref) this.gcInterval.unref();
    }
  }

  public check(
    key: string,
    maxRequests = this.defaultMax
  ): { isLimited: boolean; remaining: number; retryAfterSec: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: maxRequests, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    const refill = (elapsed / this.windowMs) * maxRequests;
    bucket.tokens = Math.min(maxRequests, bucket.tokens + refill);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const retryAfterSec = Math.ceil(((1 - bucket.tokens) * (this.windowMs / maxRequests)) / 1000);
      return { isLimited: true, remaining: 0, retryAfterSec: Math.max(1, retryAfterSec) };
    }

    bucket.tokens -= 1;
    return {
      isLimited: false,
      remaining: Math.floor(bucket.tokens),
      retryAfterSec: 0,
    };
  }

  private cleanup() {
    const cutoff = Date.now() - this.windowMs * 2;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastRefill < cutoff) {
        this.buckets.delete(key);
      }
    }
  }

  public reset() {
    this.buckets.clear();
  }
}

export const rateLimiter = new TokenBucketRateLimiter(60_000, 30);

export function isRateLimited(key: string, maxRequests = 20): boolean {
  return rateLimiter.check(key, maxRequests).isLimited;
}

/* ============================================================================
 * 5. CSRF & Origin Verification
 * ============================================================================ */

export function verifySameOrigin(
  requestHeaders: Headers,
  requestUrl: string
): boolean {
  const origin = requestHeaders.get("origin");
  const referer = requestHeaders.get("referer");

  if (!origin && !referer) {
    return true;
  }

  try {
    const targetUrl = new URL(requestUrl);
    const expectedHost = targetUrl.host;

    if (origin) {
      const originUrl = new URL(origin);
      return originUrl.host === expectedHost;
    }

    if (referer) {
      const refererUrl = new URL(referer);
      return refererUrl.host === expectedHost;
    }
  } catch {
    return false;
  }

  return true;
}

export function enforceCsrf(req: NextRequest, requestId: string): NextResponse | null {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    if (!verifySameOrigin(req.headers, req.url)) {
      return errorResponse("Cross-Origin request blocked.", 403, requestId);
    }
  }
  return null;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function getOrNewRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}

/* ============================================================================
 * 6. Audit Logging & Security Headers
 * ============================================================================ */

export function auditLog(action: string, metadata: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[AUDIT-LOG] [${new Date().toISOString()}] ${action}:`, JSON.stringify(metadata));
  }
}

export function getSecurityHeaders(requestId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  };

  if (requestId) {
    headers["X-Request-Id"] = requestId;
  }

  return headers;
}

export function errorResponse(
  message: string,
  status: number,
  requestId: string,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        ...getSecurityHeaders(requestId),
        ...(extraHeaders || {}),
      },
    }
  );
}

export function okResponse<T>(data: T, requestId: string): NextResponse {
  return NextResponse.json(data, {
    status: 200,
    headers: getSecurityHeaders(requestId),
  });
}
