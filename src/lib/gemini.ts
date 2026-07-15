import { StadiumAI } from "./ai-engine";
import type { AIResponse, AppState } from "./types";

const MODEL = "gemini-2.5-flash";

function sanitize(value: string) {
  return String(value ?? "")
    .replace(/[<>&"']/g, (char) => {
      const map: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char];
    })
    .trim();
}

export function getStoredGeminiKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("fifa2026.geminiApiKey") || "";
}

export function saveGeminiKey(rawKey: string) {
  const key = String(rawKey || "").trim();
  if (!/^[A-Za-z0-9_\-]{20,}$/.test(key)) {
    throw new Error("Enter a valid Gemini API key before saving.");
  }
  localStorage.setItem("fifa2026.geminiApiKey", key);
}

export function clearGeminiKey() {
  localStorage.removeItem("fifa2026.geminiApiKey");
}

export async function askAssistant(
  query: string,
  context: Partial<AppState> & { venueName?: string }
): Promise<AIResponse> {
  const sanitizedQuery = sanitize(query);
  if (!sanitizedQuery) throw new Error("Message cannot be empty.");

  const fallback = (reason: string): AIResponse => ({
    ...StadiumAI.matchFallbackResponse(sanitizedQuery, {
      venueName: context.venueName,
      role: context.role,
      sectors: context.sectors,
      queues: context.queues,
      gates: context.gates,
      incidents: context.incidents,
    }),
    fallbackReason: reason,
  });

  const apiKey = getStoredGeminiKey();
  const useServerProxy = !apiKey;

  try {
    const densitySummary = (context.sectors || [])
      .map((s) => `${s.name}: ${s.density} persons/m2`)
      .join("; ");
    const incidentSummary =
      (context.incidents || [])
        .filter((i) => i.status !== "resolved")
        .map((i) => `${i.type} at ${i.location}`)
        .join("; ") || "No unresolved incidents";

    const system = [
      "You are the FIFA 2026 Smart Stadium AI Operations Center assistant.",
      "Use concise operational language. Do not invent venue facts.",
      `Current venue: ${context.venueName || "Unknown venue"}.`,
      `Match state: ${context.matchState || "Pre-match operations"}.`,
      `Active user role: ${context.role || "fan"}.`,
      `Crowd density: ${densitySummary || "No density data available"}.`,
      `Active incidents: ${incidentSummary}.`,
      "When giving safety guidance, prefer verified operational data.",
    ].join("\n");

    let payload;

    if (useServerProxy) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: sanitizedQuery,
          system,
          model: MODEL,
        }),
      });

      if (!res.ok) {
        return fallback(`Gemini server proxy request failed (${res.status}).`);
      }

      payload = await res.json();
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: sanitizedQuery }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
          }),
        }
      );

      if (!res.ok) {
        return fallback(`Gemini request failed (${res.status}).`);
      }

      payload = await res.json();
    }

    const text = (payload?.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("\n")
      .trim();

    if (!text) return fallback("Empty Gemini response.");

    return {
      source: useServerProxy ? "gemini-proxy" : "gemini",
      summary: text,
      cards: [],
      actions: [],
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return fallback("Network error reaching Gemini.");
  }
}
