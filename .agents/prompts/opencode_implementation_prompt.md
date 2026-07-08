# 🤖 OPENCODE — Phase 2 Implementation Prompt

> **Task**: T-012 and T-014  
> **Target Agent**: OpenCode  
> **Model**: Kimi K2.6  
> **Output Files**: `js/stadium-map.js`, `js/simulator.js`, `assets/stadium-map.svg`, `data/stadiums.json`, `data/translations.json`, `data/responses.json`

---

## 🎯 Task Objectives

You are assigned to build the interactive SVG stadium map, real-time data simulation engine, and structured data files for the FIFA 2026 Smart Stadium AI Operations Center.

### 1. Build the Interactive SVG Map (`js/stadium-map.js` & `assets/stadium-map.svg`)
- Create a clean vector SVG blueprint of a stadium layout (`assets/stadium-map.svg`) including:
  - 12 labeled sectors (Sections 101-112, 201-212)
  - 6 entry gates (Gates A to F)
  - Concourse zones containing concession blocks and restrooms
- Implement interactivity in `js/stadium-map.js`:
  - **Heatmap Layer**: Dynamically color sectors based on live density (safe/moderate/crowded/critical) using CSS classes in `css/views.css`.
  - **AI Predictions**: Render predicted bottlenecks with flowing dashed outlines.
  - **Incident Pins**: Pulse indicators on map coordinates corresponding to active alerts.
  - **Sector Details**: Show dynamic custom tooltips on hover and trigger view shifts on click.
  - **Controls**: Zoom in, zoom out, pan, and toggle overlays.

### 2. Implement the Live Simulator (`js/simulator.js`)
Build a state simulator that broadcasts updates on a 5-second interval:
- **Fan Flow curves**:
  - *Pre-match*: Incoming flows peaking 45 min before kickoff.
  - *Halftime*: Massive surges toward concessions/restrooms (Wait times spike).
  - *Post-match*: Mass egress toward transit stations.
- **Incident Dispatcher**: Spawns incidents (spills, medical emergencies, ticketing gate blocks) at randomized intervals, feeding the AI triage queue.
- **Weather Context**: Varies outdoor temperature/sun exposure, forcing fans in sunny sectors to seek shaded/indoor concourses.

### 3. Generate Data Files (`data/stadiums.json`, `data/translations.json`, `data/responses.json`)
- **`stadiums.json`**: Structural array for all 16 World Cup stadiums with capacities, lat/long coordinates, sector divisions, transit modes, and access details from our research.
- **`translations.json`**: Localization dictionaries for English, Spanish, French, Arabic, German, Hindi, Japanese, Portuguese, and Mandarin.
- **`responses.json`**: Deep set of fallback response templates covering seat guides, concession menus, transportation status, and emergency instructions in all 9 languages.

---

## 🛠️ Implementation Requirements
- **No external frameworks or packages**: Use vanilla ES6 JavaScript. Use the CSS variables and classes from the existing CSS files (`css/variables.css`, `css/base.css`, `css/layout.css`, `css/components.css`, `css/views.css`).
- **No placeholders**: All coordinates, stadium attributes, and translation terms must be actual data matching the research deliverables.
- **Performance**: Optimize SVG manipulations to prevent layout thrashing and ensure smooth 60fps animations.
