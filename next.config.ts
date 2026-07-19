import type { NextConfig } from "next";

/**
 * Next.js configuration for FIFA 2026 Smart Stadium.
 *
 * Security headers follow OWASP & Mozilla Observatory recommendations:
 * - CSP: restricts script/style/connect/object sources to known origins.
 * - HSTS: 2-year max-age, includeSubDomains, preload (eligible for hstspreload.org).
 * - Clickjacking: X-Frame-Options DENY + frame-ancestors 'none' + CORP same-origin.
 * - Cross-Origin Isolation: COOP same-origin + COEP credentialless.
 * - Referrer-Policy: strict-origin-when-cross-origin.
 * - Permissions-Policy: disables unused device APIs (camera, payment, USB, etc.).
 * - X-Content-Type-Options: nosniff.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "battery=()",
              "camera=()",
              "display-capture=()",
              "document-domain=()",
              "encrypted-media=()",
              "execution-while-not-rendered=()",
              "execution-while-out-of-viewport=()",
              "geolocation=()",
              "gyroscope=()",
              "magnetometer=()",
              "microphone=(self)",
              "midi=()",
              "payment=()",
              "picture-in-picture=()",
              "publickey-credentials-get=()",
              "screen-wake-lock=()",
              "speaker-selection=()",
              "usb=()",
              "web-share=()",
              "xr-spatial-tracking=()",
            ].join(", "),
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://generativelanguage.googleapis.com https://worldcup26.ir",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "upgrade-insecure-requests",
              "require-trusted-types-for 'script'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
