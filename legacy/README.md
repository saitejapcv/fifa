# FIFA 2026 World Cup — Smart Stadium AI Operations Center

A state-of-the-art GenAI-enabled **Smart Stadium & Tournament Operations Center Dashboard** built for the FIFA World Cup 2026. The system assists stadium coordinators, safety supervisors, and tournament organizers in managing fan safety, gate flows, queue optimization, resource allocation, and incident response.

---

## 🌟 Core Features

- **Interactive Crowd Map**: Real-time crowd density heatmap using dynamic SVG sector rendering (Sections 101-112, 201-212) with zoom, pan, and legend overlays.
- **AI Decision-Making Engine**: A robust operational rules engine that translates raw sensor streams (density, queue times, gate flow, weather) into actionable commands.
- **Incident Command & Auto-Triage**: Incoming alerts are scored automatically by severity (Green/Amber/Red) using multi-factor calculations (density, urgency, kickoff countdown).
- **Gate Flow & Queue Optimization**: Live recommendations to divert queue bottlenecks and rebalance throughput across entry points.
- **Gemini API Integration**: Context-aware natural language assistant powered by `gemini-2.5-flash` with a local rules fallback for zero-API-key operations.
- **Sustainability Monitoring**: Live carbon scoring, waste diversion percentages, and grid-load metrics.
- **Role-Based Console**: Toggle between **Fan**, **Staff**, and **Organizer** views to see customized KPIs, action links, and tools.
- **WCAG 2.2 AA Accessibility**: Accessible contrast toggle, large-text scaling, skip-nav links, ARIA landmark roles, and `aria-live` announcement regions.

---

## 📁 Project Structure

```
/Users/p.c.vsaiteja/Documents/fifa/
├── index.html              # Main SPA HTML structure (WCAG AA)
├── css/
│   ├── variables.css       # Color tokens, fonts, spacing, glassmorphism
│   ├── base.css            # Typography reset and focus outline rules
│   ├── layout.css          # App shell layout (CSS Grid) and mobile views
│   ├── components.css      # KPI cards, buttons, badges, toast, chat bubbles
│   └── views.css           # Stadium SVG styles, tooltips, legend, and overlay
├── js/
│   ├── utils.js            # XSS sanitization, focus traps, timeAgo formats
│   ├── ai-engine.js        # Local AI decision-making (gate, incident triage, etc.)
│   ├── gemini-api.js       # Client for gemini-2.5-flash with local fallback
│   ├── simulator.js        # Live match simulation engine (phases, weather, events)
│   ├── stadium-map.js      # Zoom/pan SVG map interactions and heatmap rendering
│   ├── incidents.js        # Incident command feed and triage queue
│   ├── chat.js             # Conversational UI with quick-chips and rich cards
│   ├── dashboard.js        # Primary app controller, role KPI card layouts
│   └── app.js              # Coordinator bridging simulator, map, and state
├── data/
│   ├── stadiums.json       # Metadata for all 16 host stadiums
│   ├── translations.json   # Localization tables for 9 languages
│   └── responses.json      # Structured fallback responses for common intents
├── assets/
│   └── stadium-map.svg     # 2D stadium blueprint containing interactive layers
├── README.md               # User guide and project overview
└── .gitignore              # Standard ignore configurations
```

---

## 🚀 Getting Started

1. **Deploy Locally**: 
   Simply open `index.html` in any modern web browser. No compilation, node dependencies, or complex setup is required. All operations are native.
   
2. **Setup Gemini API**:
   - Go to **Settings & API** view.
   - Enter your Google Gemini API key.
   - Click **Save**. The key is stored securely in your browser's `localStorage` and is never transmitted to any third-party other than the official Google API endpoint.
   
3. **Local Fallback Engine**:
   If no API key is provided, the dashboard automatically activates the local rule-based AI engine to match intents and recommend actions.

---

## 🛡️ Hackathon Rubric Compliance

- **Goal Alignment**: Directly addresses tournament operations, crowd safety, multilingual support, and GenAI-guided decision support.
- **Security**: No hardcoded API keys. Stored in `localStorage`. Sanitized inputs to protect against XSS.
- **Accessibility**: Standard font scaling, colorblind-safe heatmap levels, and screen-reader accessible live regions.
- **Performance**: High performance native CSS transitions, zero external packages, optimized rendering loops.
