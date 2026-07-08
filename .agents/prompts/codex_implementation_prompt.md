# 🤖 CODEX — Phase 2 Implementation Prompt (Chain-Prompt v2)

> **Task**: T-010, T-011, and T-013  
> **Target Agent**: Codex  
> **Model**: GPT-5.5 (High reasoning)  
> **Output Files**: `index.html`, `js/ai-engine.js`, `js/gemini-api.js`, `js/chat.js`, `js/dashboard.js`, `js/incidents.js`

---

## ⚠️ CRITICAL CONTEXT

The CSS design system already exists at `css/`. You MUST use the exact class names defined there. Do NOT create your own styles. The layout system uses CSS Grid.

**Existing CSS files to link in `<head>` (in order):**
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/views.css">
```

**JS files to load (use `type="module"` or load before `</body>`):**
```html
<script src="js/utils.js"></script>
<script src="js/ai-engine.js"></script>
<script src="js/gemini-api.js"></script>
<script src="js/simulator.js"></script>
<script src="js/stadium-map.js"></script>
<script src="js/chat.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/incidents.js"></script>
<script src="js/app.js"></script>
```

---

## 1. Build `index.html` (Task T-010)

### Required Layout Structure
```html
<body>
  <a href="#main-content" class="skip-nav">Skip to main content</a>
  <div class="app-shell" id="app-shell">
    <!-- Sidebar -->
    <aside class="app-sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-logo">...</div>
      <nav class="sidebar-nav">...</nav>
      <div class="role-switcher">...</div>
    </aside>
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">...</div>
      <div class="header-center">...</div>
      <div class="header-right">...</div>
    </header>
    <!-- Main Content -->
    <main class="app-main" id="main-content">
      <section class="view active" id="view-dashboard">...</section>
      <section class="view" id="view-map">...</section>
      <section class="view" id="view-chat">...</section>
      <section class="view" id="view-incidents">...</section>
      <section class="view" id="view-queues">...</section>
      <section class="view" id="view-transport">...</section>
      <section class="view" id="view-sustainability">...</section>
      <section class="view" id="view-accessibility">...</section>
      <section class="view" id="view-settings">...</section>
      <section class="view" id="view-emergency">...</section>
    </main>
    <!-- Chat Panel (slides out from right) -->
    <aside class="chat-panel" id="chat-panel" role="complementary" aria-label="AI Assistant">
      <div class="chat-panel-header">...</div>
      <div class="chat-messages" id="chat-messages" role="log" aria-live="polite">...</div>
      <div class="chat-chips" id="chat-chips">...</div>
      <div class="chat-input-area">...</div>
    </aside>
  </div>
  <!-- Toast Container -->
  <div class="toast-container" id="toast-container" aria-live="polite"></div>
  <!-- Emergency Overlay -->
  <div class="emergency-overlay" id="emergency-overlay" role="alertdialog" aria-modal="true">...</div>
  <!-- Screen Reader Announcements -->
  <div class="aria-live-region" aria-live="assertive" id="sr-announcements"></div>
  <!-- Mobile Bottom Nav (hidden on desktop) -->
  <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile navigation">...</nav>
</body>
```

### Exact View IDs (must match)
| # | View ID | Nav Icon Suggestion | Visible to Roles |
|---|---|---|---|
| 1 | `view-dashboard` | 📊 | All |
| 2 | `view-map` | 🗺️ | All |
| 3 | `view-chat` | 💬 | All (mobile only, desktop uses panel) |
| 4 | `view-incidents` | 🚨 | Staff, Organizer |
| 5 | `view-queues` | ⏱️ | Fan, Staff |
| 6 | `view-transport` | 🚌 | Fan |
| 7 | `view-sustainability` | 🌿 | Organizer |
| 8 | `view-accessibility` | ♿ | Fan |
| 9 | `view-settings` | ⚙️ | All |
| 10 | `view-emergency` | 🆘 | All (normally hidden) |

### Sidebar Nav Items
Each item MUST use class `nav-item` with `data-view` attribute:
```html
<button class="nav-item active" data-view="dashboard" aria-current="page">
  <span class="nav-item-icon">📊</span>
  <span class="nav-item-label">Dashboard</span>
</button>
```

### Role Switcher Buttons
Three buttons in `.role-switcher` with class `role-btn`, `data-role` attribute:
```html
<button class="role-btn active" data-role="fan">👤 Fan</button>
<button class="role-btn" data-role="staff">🛡️ Staff</button>
<button class="role-btn" data-role="organizer">📋 Organizer</button>
```

### Header Elements
- `.match-clock` with id `match-clock` for the live timer
- `.venue-selector` — a `<select>` with id `venue-selector`, options populated from `data/stadiums.json`
- Notification button: `.notification-btn` with `.notification-badge`
- Chat toggle button with id `chat-toggle-btn`
- Sidebar collapse button: `.sidebar-toggle` with id `sidebar-toggle`

### Settings View Content
Must include:
- **API Key input**: `<input type="password" id="gemini-api-key">` with save/clear buttons
- **Language selector**: `<select id="language-selector">` with 9 language options
- **Accessibility toggles**: High contrast (`id="toggle-high-contrast"`), Large text (`id="toggle-large-text"`)

---

## 2. Implement `js/ai-engine.js` (Task T-011)

Export a global `AIEngine` object with these methods:

```javascript
const AIEngine = {
  analyzeCrowdDensity(sectors) { ... },   // Returns { predictions[], alerts[], recommendations[] }
  optimizeGateFlow(gates) { ... },         // Returns { rebalancingPlan[], bottlenecks[] }
  triageIncident(incident) { ... },        // Returns { severity, action, assignee, escalationMinutes }
  predictQueueWait(queueData) { ... },     // Returns { estimatedWait, alternative, confidence }
  recommendStaffDeployment(density, incidents) { ... }, // Returns { changes[] }
  calculateSustainabilityScore(metrics) { ... }, // Returns { score, breakdown, suggestions[] }
  planEvacuationRoute(crowd, blocked) { ... },   // Returns { routes[], instructions }
  matchFallbackResponse(query, context) { ... }  // Returns { text, cards[], actions[] }
};
```

### Density Thresholds (from crowd_management_analysis.md)
- **Safe**: < 2 persons/m² → class `density-safe`
- **Moderate**: 2–4 persons/m² → class `density-moderate`
- **Crowded**: 4–6 persons/m² → class `density-crowded` → Amber alert
- **Critical**: > 6 persons/m² → class `density-critical` → Red alert + evacuation consideration

### Incident Triage Scoring
Score = `typeSeverity × 0.4 + densityFactor × 0.3 + timeToKickoff × 0.3`
- Medical: typeSeverity = 5, Security: 4, Fire: 5, Spill: 2, Lost child: 3
- Green: score < 3, Amber: 3-6, Red: > 6

### Fallback Response Matching
Use regex patterns to match user intent categories:
- `/seat|section|row|find.*seat/i` → seat-finding response
- `/restroom|bathroom|toilet|wc/i` → nearest restroom with queue time
- `/food|eat|drink|concession|hungry/i` → nearest concession options
- `/exit|leave|go.*home|transport/i` → transport and exit guidance
- `/help|emergency|medical|lost/i` → emergency response
- `/weather|hot|cold|rain|sun/i` → weather-aware suggestions

---

## 3. Implement `js/gemini-api.js` (Task T-011)

```javascript
const GeminiAPI = {
  getApiKey() { ... },          // Read from localStorage('gemini-api-key')
  setApiKey(key) { ... },       // Store in localStorage
  isConfigured() { ... },       // Returns boolean
  async sendMessage(userMessage, context) { ... }  // Returns AI response string
};
```

**System prompt template** (injected automatically):
```
You are the AI Operations Assistant for the FIFA World Cup 2026 at {venueName}.
Current match: {matchInfo}. Current role: {userRole}.
Crowd density: {densityOverview}. Active incidents: {incidentCount}.
Language: {userLanguage}.

Respond helpfully and concisely. If asked about real-time data, use the provided context.
For safety-critical questions, always err on the side of caution.
```

**API endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}`

---

## 4. Implement UI Controllers (Task T-013)

### `js/chat.js`
Export a global `ChatUI` object:
- `init()` — bind input events, render initial welcome message
- `addMessage(role, text, cards)` — render a chat bubble (role: 'user' | 'ai')
- `showTyping()` / `hideTyping()` — typing indicator animation
- `renderChips(chips)` — quick action buttons in `.chat-chips`
- `renderResponseCard(card)` — rich embedded card inside AI bubble

Default quick chips: `["🪑 Find my seat", "🚻 Nearest restroom", "🍔 Food options", "🚌 Exit routes", "🚨 Report incident", "🌐 Change language"]`

### `js/dashboard.js`
Export a global `Dashboard` object:
- `init(role)` — render KPI cards based on active role
- `updateKPIs(data)` — animate number transitions using `.rolling-number` class
- `renderSparkline(container, dataPoints)` — inline SVG sparkline
- `renderAIInsight(insight)` — renders `.ai-insight-card` with recommendation text

**Fan KPIs**: Crowd Level, Gate Wait, Nearest Restroom Wait, Match Clock  
**Staff KPIs**: Active Incidents, Busiest Gate, Longest Queue, Staff Deployed  
**Organizer KPIs**: Total Attendance, Carbon Score, Gate Throughput, Sustainability %

### `js/incidents.js`
Export a global `IncidentManager` object:
- `init()` — render incident feed
- `addIncident(incident)` — push new incident, auto-triage via `AIEngine.triageIncident()`
- `renderIncidentCard(incident)` — uses `.incident-card`, `.incident-severity`, `.incident-timer`
- `resolveIncident(id)` — mark resolved, log timestamp
- `filterBySeverity(level)` — filter visible cards

---

## ⛔ DO NOT
- Do NOT create any new CSS files or inline styles — use existing classes only
- Do NOT use `document.write()` — use `createElement` or `innerHTML` with sanitization
- Do NOT hardcode API keys anywhere
- Do NOT modify any files in `.agents/`
- Do NOT create `app.js` or `utils.js` — those are assigned to the Orchestrator (T-015)
