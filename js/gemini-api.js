(() => {
  'use strict';

  const API_KEY_STORAGE_KEY = 'fifa2026.geminiApiKey';
  const MODEL_NAME = 'gemini-2.5-flash';
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

  const sanitizePlainText = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]).trim();

  const getApiKey = () => localStorage.getItem(API_KEY_STORAGE_KEY) || '';

  const buildSystemInstruction = (context = {}) => {
    const densitySummary = (context.sectors || [])
      .map((sector) => `${sector.name}: ${sector.density} persons/m2`)
      .join('; ');
    const incidentSummary = (context.incidents || [])
      .filter((incident) => incident.status !== 'resolved')
      .map((incident) => `${incident.type} at ${incident.location}`)
      .join('; ') || 'No unresolved incidents';

    return [
      'You are the FIFA 2026 Smart Stadium AI Operations Center assistant.',
      'Use concise operational language. Do not invent venue facts.',
      `Current venue: ${context.venueName || 'Unknown venue'}.`,
      `Match state: ${context.matchState || 'Pre-match operations'}.`,
      `Active user role: ${context.role || 'fan'}.`,
      `Crowd density: ${densitySummary || 'No density data available'}.`,
      `Active incidents: ${incidentSummary}.`,
      'When giving safety guidance, prefer verified operational data and recommend staff confirmation for red incidents.'
    ].join('\n');
  };

  const parseGeminiText = (payload) => {
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    return parts.map((part) => part.text || '').join('\n').trim();
  };

  const fallback = (query, context, reason) => ({
    ...window.StadiumAI.matchFallbackResponse(query, context),
    fallbackReason: reason
  });

  const GeminiClient = {
    keyName: API_KEY_STORAGE_KEY,

    hasApiKey() {
      return Boolean(getApiKey());
    },

    saveApiKey(rawKey) {
      const key = String(rawKey || '').trim();
      if (!/^[A-Za-z0-9_\-]{20,}$/.test(key)) {
        throw new Error('Enter a valid Gemini API key before saving.');
      }
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      return true;
    },

    clearApiKey() {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    },

    async generate(query, context = {}) {
      const sanitizedQuery = sanitizePlainText(query);
      if (!sanitizedQuery) {
        throw new Error('Message cannot be empty.');
      }

      const apiKey = getApiKey();
      if (!apiKey) {
        return fallback(sanitizedQuery, context, 'No Gemini API key configured.');
      }

      const body = {
        systemInstruction: {
          parts: [{ text: buildSystemInstruction(context) }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: sanitizedQuery }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 700
        }
      };

      try {
        const response = await fetch(`${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`Gemini API returned ${response.status}.`);
        }

        const payload = await response.json();
        const text = parseGeminiText(payload);

        if (!text) {
          throw new Error('Gemini API returned an empty response.');
        }

        return {
          source: 'gemini',
          summary: text,
          cards: [],
          actions: [],
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.warn('Gemini fallback activated:', error);
        return fallback(sanitizedQuery, context, error.message);
      }
    }
  };

  window.GeminiClient = GeminiClient;
})();
