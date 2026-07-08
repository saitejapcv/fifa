# 🔬 CODEX — Task T-006: Stadium App Analysis & User Pain Points

> **Paste the `codex_system_prompt.md` FIRST, then paste this prompt.**

---

## Task T-006: Stadium App Competitive Analysis & User Pain Points

**Priority**: High  
**Deliverable**: Create the file `.agents/research/stadium_apps_analysis.md` in the workspace `/Users/p.c.vsaiteja/Documents/fifa`

---

### Part 1: App-by-App Analysis

For each of **FIFA+**, **MLB Ballpark**, and **NFL GameDay**, research and document:

#### Core Features & User Flows
- Onboarding flow (language selection, location, team preference)
- Home screen layout and primary navigation pattern
- In-venue vs. out-of-venue experience (what changes on match day?)
- Ticketing and entry flow
- Stadium navigation and wayfinding (map type, seat finder)
- Food/concession ordering (if available)
- Real-time match data and notifications
- Social/community features

#### Likely Tech Stack
- Frontend framework (React Native, Flutter, native Swift/Kotlin)
- Backend architecture (microservices, serverless, monolith)
- AI/ML services used (recommendations, search, chatbots)
- Real-time infrastructure (WebSockets, SSE, Firebase, MQTT)
- Map/navigation SDK (Mapbox, Google Maps, custom SVG)
- Analytics platform (Firebase Analytics, Mixpanel, Amplitude)

### Part 2: Feature Comparison Matrix

Create a markdown table with this structure:

| Feature | FIFA+ | MLB Ballpark | NFL GameDay | Our Opportunity |
|---|---|---|---|---|
| Seat finder / wayfinding | | | | |
| Food ordering | | | | |
| AR features | | | | |
| Multilingual support | | | | |
| AI chatbot / assistant | | | | |
| Accessibility modes | | | | |
| Real-time crowd info | | | | |
| Sustainability info | | | | |
| Offline mode | | | | |
| ... | | | | |

Mark each cell: ✅ Has it | ⚠️ Partial | ❌ Missing

### Part 3: User Pain Points (Top 20)

Search App Store reviews, Reddit (r/FIFA, r/worldcup, r/sports, r/baseball, r/nfl), and Twitter/X for complaints about stadium/venue experience apps. Focus on Qatar 2022 World Cup app complaints.

Create a ranked table:

| Rank | Pain Point | Category | Frequency | Source Examples | How GenAI Could Solve It |
|---|---|---|---|---|---|
| 1 | | Navigation / Language / Speed / Accessibility / Crowd / Food / Transit | High/Med/Low | "Reddit user said..." | "AI could..." |

Categories to use: Navigation, Language, Speed, Accessibility, Crowd, Food/Services, Transportation

### Output Format
- Clean markdown with tables
- Cite sources where possible
- If data is unavailable, mark as `[NOT FOUND]` — do NOT fabricate

### Rules
- Do NOT modify any `.agents/` tracking files
- Do NOT create placeholder data
- Write to `.agents/research/stadium_apps_analysis.md` only

After completing, provide a completion report:
```
## Task Completion Report
### Task: T-006 — Stadium App Analysis & User Pain Points
### Files Created: `.agents/research/stadium_apps_analysis.md`
### Ready for Validation: Yes/No
### Known Limitations: <gaps>
```
