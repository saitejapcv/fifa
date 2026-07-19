import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiter, verifySameOrigin, getSecurityHeaders } from "@/lib/security";

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB limit for API requests (e.g. audio/roster upload)

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const pathname = request.nextUrl.pathname;

  // 1. Enforce body size limits on API routes
  if (pathname.startsWith("/api/")) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Payload exceeds 10MB limit." },
        { status: 413, headers: { ...getSecurityHeaders(requestId) } }
      );
    }

    // 2. Validate Origin on mutating HTTP requests (POST, PUT, DELETE, PATCH)
    const method = request.method.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      if (!verifySameOrigin(request.headers, request.url)) {
        return NextResponse.json(
          { error: "Cross-Origin request blocked." },
          { status: 403, headers: { ...getSecurityHeaders(requestId) } }
        );
      }
    }

    // 3. Global API Rate Limiting by IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { isLimited, retryAfterSec } = rateLimiter.check(`ip:${clientIp}:${pathname}`, 40);

    if (isLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before retrying." },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(requestId),
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }
  }

  // 4. Create response and inject global security headers & request ID
  const response = NextResponse.next();
  const secHeaders = getSecurityHeaders(requestId);

  Object.entries(secHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Attach COOP/CORP headers
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, icon.png
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png).*)",
  ],
};
