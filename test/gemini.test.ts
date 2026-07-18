import assert from "node:assert/strict";
import test, { describe, beforeEach, afterEach, it } from "node:test";
import { clearGeminiKey, getStoredGeminiKey, saveGeminiKey, askAssistant, parseRosterData, translateText, translateAudio } from "../src/lib/gemini";

function installBrowserStorage(initialValues: Record<string, string> = {}) {
  const storage = new Map(Object.entries(initialValues));
  const localStorage: Storage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (index) => [...storage.keys()][index] ?? null,
  };

  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorage });
  return storage;
}

function mockFetch(responses: Record<string, any>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, options?: any) => {
    const urlString = url.toString();
    for (const [key, response] of Object.entries(responses)) {
      if (urlString.includes(key)) {
        if (response.error) {
          return { ok: false, status: response.status || 500, json: async () => ({ error: response.error }), text: async () => response.error } as Response;
        }
        return { ok: true, status: 200, json: async () => response, text: async () => JSON.stringify(response) } as Response;
      }
    }
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" } as Response;
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

describe("Gemini Storage Tests", () => {
  beforeEach(() => {
    installBrowserStorage();
  });

  it("gemini getStoredGeminiKey returns empty string when no key", () => {
    assert.equal(getStoredGeminiKey(), "");
  });

  it("gemini getStoredGeminiKey returns stored key", () => {
    installBrowserStorage({ "fifa2026.geminiApiKey": "test_key_1234567890123" });
    assert.equal(getStoredGeminiKey(), "test_key_1234567890123");
  });

  it("gemini clearGeminiKey removes key", () => {
    const storage = installBrowserStorage({ "fifa2026.geminiApiKey": "test_key_1234567890123" });
    clearGeminiKey();
    assert.equal(storage.has("fifa2026.geminiApiKey"), false);
  });

  it("saveGeminiKey rejects short keys", () => {
    assert.throws(() => saveGeminiKey("short"), /valid Gemini API key/);
  });

  it("saveGeminiKey accepts valid keys", () => {
    const storage = installBrowserStorage();
    saveGeminiKey("valid_key_1234567890");
    assert.equal(storage.get("fifa2026.geminiApiKey"), "valid_key_1234567890");
  });

  it("saveGeminiKey rejects keys with special characters", () => {
    assert.throws(() => saveGeminiKey("invalid_key_@#$1234567890"), /valid Gemini API key/);
  });
});

describe("Gemini Function Tests", () => {
  let restoreFetch: () => void;

  beforeEach(() => {
    installBrowserStorage();
  });

  afterEach(() => {
    if (restoreFetch) restoreFetch();
  });

  it("askAssistant throws on empty query", async () => {
    await assert.rejects(async () => {
      await askAssistant("", {});
    }, /Message cannot be empty/);
  });

  it("askAssistant uses server proxy and returns successfully", async () => {
    restoreFetch = mockFetch({
      "/api/worldcup?endpoint=games": { games: [{ id: "1", stadium_id: "1", type: "Group", finished: "TRUE", home_score: 1, away_score: 0 }] },
      "/api/worldcup?endpoint=stadiums": { stadiums: [{ id: "1", name_en: "Test Stadium" }] },
      "/api/worldcup?endpoint=teams": { teams: [{ id: "1" }] },
      "/api/chat": { candidates: [{ content: { parts: [{ text: 'Server response' }] } }] }
    });
    const res = await askAssistant("Hello", { venueName: "Test Venue", sectors: [{ name: "A", density: 100 }], incidents: [{ type: "medical", status: "open", location: "A" }] });
    assert.equal(res.summary, "Server response");
    assert.equal(res.source, "gemini-proxy");
  });

  it("askAssistant handles server proxy failure and returns fallback", async () => {
    restoreFetch = mockFetch({
      "/api/worldcup": {},
      "/api/chat": { error: "Failed", status: 500 }
    });
    const res = await askAssistant("Hello", { venueName: "Test Venue" });
    assert.equal(res.fallbackReason?.includes("Gemini server proxy request failed"), true);
  });

  it("askAssistant uses direct API key and returns successfully", async () => {
    installBrowserStorage({ "fifa2026.geminiApiKey": "valid_key_1234567890" });
    restoreFetch = mockFetch({
      "/api/worldcup": {},
      "generativelanguage.googleapis.com": { candidates: [{ content: { parts: [{ text: 'Direct response' }] } }] }
    });
    const res = await askAssistant("Hello", {});
    assert.equal(res.summary, "Direct response");
    assert.equal(res.source, "gemini");
  });
  
  it("askAssistant handles malformed JSON response gracefully", async () => {
    restoreFetch = mockFetch({
      "/api/worldcup": {},
      "/api/chat": { candidates: [{ content: { parts: [{ text: '' }] } }] } // Empty text triggers fallback
    });
    const res = await askAssistant("Hello", {});
    assert.equal(res.fallbackReason?.includes("Empty Gemini response"), true);
  });

  it("parseRosterData returns empty object for empty input", async () => {
    const res = await parseRosterData("");
    assert.equal(res.tickets.length, 0);
  });

  it("parseRosterData uses server proxy", async () => {
    restoreFetch = mockFetch({
      "/api/chat": { candidates: [{ content: { parts: [{ text: '{"tickets": [{"ticketNo": "1"}], "staff": []}' }] } }] }
    });
    const res = await parseRosterData("Raw data");
    assert.equal(res.tickets.length, 1);
  });

  it("parseRosterData handles direct key and failure gracefully via fallback CSV parser", async () => {
    installBrowserStorage({ "fifa2026.geminiApiKey": "valid_key_1234567890" });
    restoreFetch = mockFetch({
      "generativelanguage.googleapis.com": { error: "Failed", status: 500 }
    });
    // With network failure, it falls back to parsing as CSV. A valid CSV line string should be returned.
    const res = await parseRosterData("TICKET-1,1,11,104,G8,A,1,date,lbl,staff,vol\n");
    assert.equal(res.tickets.length, 1);
  });

  it("translateText handles successful translation via proxy", async () => {
    restoreFetch = mockFetch({
      "/api/chat": { candidates: [{ content: { parts: [{ text: "Translated" }] } }] }
    });
    const res = await translateText("Hello", "Spanish");
    assert.equal(res, "Translated");
  });

  it("translateText throws on failure", async () => {
    restoreFetch = mockFetch({
      "/api/chat": { error: "Failed", status: 500 }
    });
    await assert.rejects(async () => {
      await translateText("Hello", "Spanish");
    }, /Translation failed/);
  });
  
  it("translateText directly uses API key and throws on failure", async () => {
    installBrowserStorage({ "fifa2026.geminiApiKey": "valid_key_1234567890" });
    restoreFetch = mockFetch({
      "generativelanguage.googleapis.com": { error: "Failed", status: 500 }
    });
    await assert.rejects(async () => {
      await translateText("Hello", "Spanish");
    }, /Translation failed/);
  });

  it("translateAudio successfully translates", async () => {
    restoreFetch = mockFetch({
      "/api/chat": { candidates: [{ content: { parts: [{ text: '```json\n{"transcript": "Hola", "translation": "Hello"}\n```' }] } }] }
    });
    const res = await translateAudio("base64", "audio/webm", "Spanish", "English");
    assert.equal(res.transcript, "Hola");
    assert.equal(res.translation, "Hello");
  });
  
  it("translateAudio successfully handles direct key", async () => {
    installBrowserStorage({ "fifa2026.geminiApiKey": "valid_key_1234567890" });
    restoreFetch = mockFetch({
      "generativelanguage.googleapis.com": { candidates: [{ content: { parts: [{ text: '{"transcript": "Hola", "translation": "Hello"}' }] } }] }
    });
    const res = await translateAudio("base64", "audio/webm", "Spanish", "English");
    assert.equal(res.transcript, "Hola");
    assert.equal(res.translation, "Hello");
  });

  it("translateAudio returns empty strings on failure", async () => {
    restoreFetch = mockFetch({
      "/api/chat": { error: "Failed", status: 500 }
    });
    const res = await translateAudio("base64", "audio/webm", "Spanish", "English");
    assert.equal(res.transcript, "");
    assert.equal(res.translation, "");
  });
});
