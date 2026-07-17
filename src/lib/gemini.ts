import { StadiumAI } from "./ai-engine";
import type { AIResponse, AppState } from "./types";

type WorldCupGame = {
  id?: string | number;
  stadium_id?: string | number;
  home_team_name_en?: string;
  home_team_label?: string;
  away_team_name_en?: string;
  away_team_label?: string;
  finished?: string;
  home_score?: string | number;
  away_score?: string | number;
  local_date?: string;
  type?: string;
};

type WorldCupStadium = {
  id?: string | number;
  fifa_name?: string;
  name_en?: string;
};

type ImportedRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ImportedRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const MODEL = "gemma-4";
const RESOLVED_MODEL = MODEL === "gemma-4" ? "gemma-4-26b-a4b-it" : MODEL;
const IS_GEMMA = RESOLVED_MODEL.startsWith("gemma-4");

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

let cachedGames: WorldCupGame[] | null = null;
let cachedStadiums: WorldCupStadium[] | null = null;
let cachedTeams: unknown[] | null = null;

async function fetchWorldCupData() {
  if (cachedGames && cachedStadiums && cachedTeams) {
    return { games: cachedGames, stadiums: cachedStadiums, teams: cachedTeams };
  }

  try {
    if (typeof window !== "undefined") {
      const [gamesRes, stadiumsRes, teamsRes] = await Promise.all([
        fetch("/api/worldcup?endpoint=games").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/worldcup?endpoint=stadiums").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/worldcup?endpoint=teams").then((r) => (r.ok ? r.json() : null)),
      ]);

      const gamesData = gamesRes as { games?: unknown } | null;
      const stadiumsData = stadiumsRes as { stadiums?: unknown } | null;
      const teamsData = teamsRes as { teams?: unknown } | null;
      if (Array.isArray(gamesData?.games)) cachedGames = gamesData.games as WorldCupGame[];
      if (Array.isArray(stadiumsData?.stadiums)) cachedStadiums = stadiumsData.stadiums as WorldCupStadium[];
      if (Array.isArray(teamsData?.teams)) cachedTeams = teamsData.teams;
    }
  } catch (e) {
    console.error("Error fetching World Cup database:", e);
  }

  return {
    games: cachedGames || [],
    stadiums: cachedStadiums || [],
    teams: cachedTeams || [],
  };
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
    const { games, stadiums } = await fetchWorldCupData();
    const gamesContext = games.length > 0
      ? `World Cup 2026 Match Schedule and Locations:\n` + games.map((g) => {
          const stadium = stadiums.find((s) => String(s.id) === String(g.stadium_id));
          const stadiumName = stadium ? stadium.fifa_name || stadium.name_en : `Stadium ${g.stadium_id}`;
          const home = g.home_team_name_en || g.home_team_label || "TBD";
          const away = g.away_team_name_en || g.away_team_label || "TBD";
          const score = g.finished === "TRUE" ? ` (Score: ${g.home_score}-${g.away_score})` : "";
          return `- Match ${g.id}: ${home} vs ${away} on ${g.local_date} at ${stadiumName} (${g.type} stage)${score}`;
        }).join("\n")
      : "No match data available.";

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
      "\nBelow is the verified World Cup 2026 tournament, match, and schedule database. Use it to answer match schedules, locations, results, and team timings:",
      gamesContext,
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
        `https://generativelanguage.googleapis.com/v1beta/models/${RESOLVED_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: sanitizedQuery }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 512,
              ...(IS_GEMMA ? { thinkingConfig: { thinkingLevel: "minimal" } } : {})
            },
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

export async function parseRosterData(
  fileContent: string,
  stadiumsList: { id: string; name: string }[] = []
): Promise<{
  tickets: ImportedRecord[];
  staff: ImportedRecord[];
}> {
  // 1. Try local JSON parser first
  let localParsed: { tickets: ImportedRecord[]; staff: ImportedRecord[] } | null = null;
  try {
    const raw: unknown = JSON.parse(fileContent);
    if (isRecord(raw) && (raw.tickets || raw.staff)) {
      localParsed = {
        tickets: Array.isArray(raw.tickets) ? raw.tickets.filter(isRecord) : [],
        staff: Array.isArray(raw.staff) ? raw.staff.filter(isRecord) : [],
      };
    }
  } catch {}

  if (localParsed) {
    return localParsed;
  }

  // 2. Try GenAI structured parsing if API is configured
  const apiKey = getStoredGeminiKey();
  const useServerProxy = !apiKey;

  const system = [
    "You are a structured data parser for FIFA World Cup 2026 operations.",
    "Parse the user's uploaded raw file content (which may be CSV, TSV, HTML tables, XML, or unstructured logs) and extract lists of tickets and staff.",
    "For each ticket, map it to: ticketNo (uppercase), matchId, stadiumId, section (101-112), seatNo, assignedGate (A-D), batch (1-3), date, matchLabel, staff (array of names), volunteers (array of names).",
    "For each staff member, extract: id (e.g. STAFF-002) and password.",
    `Available stadiums: ${stadiumsList.map(s => `${s.id} (${s.name})`).join(", ")}.`,
    "Output must be a valid JSON object matching this schema exactly, and nothing else. Do not wrap in markdown code blocks.",
    "{",
    '  "tickets": [ { "ticketNo": string, "matchId": string, "stadiumId": string, "section": string, "seatNo": string, "assignedGate": string, "batch": number, "date": string, "matchLabel": string, "staff": string[], "volunteers": string[] } ],',
    '  "staff": [ { "id": string, "password": string } ]',
    "}"
  ].join("\n");

  try {
    let text = "";
    if (useServerProxy) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Parse this file content:\n\n${fileContent}`,
          system,
          model: MODEL,
        }),
      });
      if (res.ok) {
        const payload = await res.json();
        text = (payload?.candidates?.[0]?.content?.parts || [])
          .map((p: { text?: string }) => p.text || "")
          .join("\n")
          .trim();
      }
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${RESOLVED_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: `Parse this data:\n\n${fileContent}` }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
              ...(IS_GEMMA ? { thinkingConfig: { thinkingLevel: "minimal" } } : {})
            },
          }),
        }
      );
      if (res.ok) {
        const payload = await res.json();
        text = (payload?.candidates?.[0]?.content?.parts || [])
          .map((p: { text?: string }) => p.text || "")
          .join("\n")
          .trim();
      }
    }

    if (text) {
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed: unknown = JSON.parse(cleanText);
      return {
        tickets: isRecord(parsed) && Array.isArray(parsed.tickets) ? parsed.tickets.filter(isRecord) : [],
        staff: isRecord(parsed) && Array.isArray(parsed.staff) ? parsed.staff.filter(isRecord) : [],
      };
    }
  } catch (e) {
    console.warn("GenAI parsing failed or returned invalid JSON. Falling back to local CSV parser.", e);
  }

  // 3. Fallback CSV Line-by-Line Parser
  const tickets: ImportedRecord[] = [];
  const staff: ImportedRecord[] = [];
  try {
    const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 2) {
        const identifier = parts[0].toUpperCase();
        if (identifier.startsWith("TICKET-") || identifier.startsWith("T-")) {
          tickets.push({
            ticketNo: identifier,
            matchId: parts[1] || "1",
            stadiumId: parts[2] || "11",
            section: parts[3] || "104",
            seatNo: parts[4] || "Row G, Seat 8",
            assignedGate: parts[5] || "A",
            batch: Number(parts[6]) || 1,
            date: parts[7] || "06/15/2026",
            matchLabel: parts[8] || "Tournament Game",
            staff: parts[9] ? [parts[9]] : [],
            volunteers: parts[10] ? [parts[10]] : [],
          });
        } else if (identifier.startsWith("STAFF-") || identifier.startsWith("S-")) {
          staff.push({
            id: identifier,
            password: parts[1] || "staffpass123",
          });
        }
      }
    });
  } catch {}

  return { tickets, staff };
}

export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  const sanitizedText = sanitize(text);
  if (!sanitizedText) return "";

  const apiKey = getStoredGeminiKey();
  const useServerProxy = !apiKey;

  const system = `You are a professional multi-lingual translator. Translate the user's text into ${targetLang}. Return ONLY the translated text without any explanations, notes, or markdown formatting. Keep the tone natural and preserve all formatting, numbers, and names.`;

  try {
    if (useServerProxy) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: sanitizedText,
          system,
          model: MODEL,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Proxy translation failed: ${res.status} ${errorText}`);
        throw new Error(`Translation failed: ${errorText}`);
      }
      const payload = await res.json();
      return (payload?.candidates?.[0]?.content?.parts || [])
        .map((p: { text?: string }) => p.text || "")
        .join("\n")
        .trim();
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${RESOLVED_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: sanitizedText }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 512,
              ...(IS_GEMMA ? { thinkingConfig: { thinkingLevel: "minimal" } } : {})
            },
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Direct translation failed: ${res.status} ${errorText}`);
        throw new Error(`Translation failed: ${errorText}`);
      }
      const payload = await res.json();
      return (payload?.candidates?.[0]?.content?.parts || [])
        .map((p: { text?: string }) => p.text || "")
        .join("\n")
        .trim();
    }
  } catch (err) {
    console.error("Translation request failed:", err);
    throw err;
  }
}

export async function translateAudio(
  base64Audio: string,
  mimeType: string,
  srcName: string,
  targetName: string
): Promise<{ transcript: string; translation: string }> {
  const apiKey = getStoredGeminiKey();
  const useServerProxy = !apiKey;

  const system = [
    `You are a professional multilingual speech translation assistant.`,
    `Analyze the user's input audio which contains speech in ${srcName}.`,
    `You must perform two tasks:`,
    `1. Transcribe the audio exactly in its original language (${srcName}) and set this as the "transcript" value.`,
    `2. Translate that transcription into ${targetName} and set this as the "translation" value.`,
    `Output must be a valid JSON object matching this schema exactly, and nothing else. Do not wrap in markdown code blocks:`,
    `{`,
    `  "transcript": "original language transcription",`,
    `  "translation": "target language translation"`,
    `}`
  ].join("\n");

  const contents = [
    {
      role: "user",
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Audio,
          },
        },
        {
          text: `Please transcribe and translate the audio from ${srcName} to ${targetName}.`,
        },
      ],
    },
  ];

  try {
    let text = "";
    if (useServerProxy) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          system,
          model: "gemini-2.5-flash",
        }),
      });

      if (!res.ok) throw new Error("Audio translation failed");
      const payload = await res.json();
      text = (payload?.candidates?.[0]?.content?.parts || [])
        .map((p: { text?: string }) => p.text || "")
        .join("\n")
        .trim();
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) throw new Error("Audio translation failed");
      const payload = await res.json();
      text = (payload?.candidates?.[0]?.content?.parts || [])
        .map((p: { text?: string }) => p.text || "")
        .join("\n")
        .trim();
    }

    if (text) {
      console.log("Raw audio translation API response:", text);
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      console.log("Cleaned JSON string:", cleanText);
      try {
        const parsed = JSON.parse(cleanText);
        console.log("Parsed audio translation:", parsed);
        const rawTranscript = parsed.transcript || parsed.transcription || "";
        const rawTranslation = parsed.translation || parsed.translated || "";
        return {
          transcript: rawTranscript.replace(/^"|"$/g, "").trim(),
          translation: rawTranslation.replace(/^"|"$/g, "").trim()
        };
      } catch (jsonErr) {
        console.error("Failed to parse audio translation JSON:", jsonErr);
      }
    }
  } catch (err) {
    console.error("Audio translation request failed:", err);
  }

  return { transcript: "", translation: "" };
}
