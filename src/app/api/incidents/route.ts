import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  enforceCsrf,
  errorResponse,
  getOrNewRequestId,
  okResponse,
  sanitizeText,
  validateBoundedNumber,
} from "@/lib/security";

const MAX_FIELD_LENGTH = 200;

function getBoundedSanitizedText(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const sanitized = sanitizeText(value);
  return sanitized.slice(0, MAX_FIELD_LENGTH) || fallback;
}

export async function GET(req: NextRequest) {
  const requestId = getOrNewRequestId(req);
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return okResponse(incidents, requestId);
  } catch {
    return errorResponse("Failed to load incidents.", 500, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = getOrNewRequestId(req);

  const csrf = enforceCsrf(req, requestId);
  if (csrf) return csrf;

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return errorResponse("Invalid incident payload.", 400, requestId);
    }

    const input = body as Record<string, unknown>;

    const externalIdRaw = typeof input.id === "string" ? input.id : typeof input.externalId === "string" ? input.externalId : null;
    const externalId = externalIdRaw ? sanitizeText(externalIdRaw).slice(0, MAX_FIELD_LENGTH) : null;

    const incident = await prisma.incident.create({
      data: {
        externalId,
        type: getBoundedSanitizedText(input.type, "Operational"),
        location: getBoundedSanitizedText(input.location, "Unknown"),
        crowdDensity: validateBoundedNumber(input.crowdDensity, 0, 15, 3),
        minutesToKickoff: validateBoundedNumber(input.minutesToKickoff, 0, 300, 45),
        status: getBoundedSanitizedText(input.status, "open"),
        severity: typeof input.severity === "string" ? sanitizeText(input.severity).slice(0, MAX_FIELD_LENGTH) : null,
        action: typeof input.action === "string" ? sanitizeText(input.action).slice(0, MAX_FIELD_LENGTH) : null,
        stadiumId: typeof input.stadiumId === "string" ? sanitizeText(input.stadiumId).slice(0, MAX_FIELD_LENGTH) : null,
      },
    });

    return okResponse(incident, requestId);
  } catch {
    return errorResponse("Failed to create incident.", 500, requestId);
  }
}
