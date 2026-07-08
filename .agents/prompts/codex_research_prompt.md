# 🔬 CODEX — Research Task Prompt (T-002 & T-003)

> **Paste the `codex_system_prompt.md` FIRST, then paste this prompt.**

---

You have been assigned **two research tasks** by the Orchestrator (Antigravity). Complete them in order.

---

## Task T-002: FIFA World Cup 2026 Data Collection

**Priority**: High  
**Deliverable**: Create the file `.agents/research/fifa_wc2026_data.md` in the workspace `/Users/p.c.vsaiteja/Documents/fifa`

### What to Research

Search the web and compile a comprehensive data document covering:

#### 1. Host Stadiums (ALL 16 venues)
For each stadium, include:
- Stadium name
- City and country (USA, Mexico, or Canada)
- Seating capacity
- Notable features (roof type, accessibility features, public transit access)
- Approximate GPS coordinates (for map integration)

#### 2. Tournament Structure
- Number of teams (48)
- Group stage format (12 groups of 4)
- Knockout round structure
- Approximate date range (June 11 – July 19, 2026)
- Number of total matches

#### 3. Transportation & Fan Zones
For at least 5 major venues (e.g., MetLife Stadium, SoFi Stadium, Estadio Azteca, AT&T Stadium, BMO Field), document:
- Nearest airports
- Public transit options (metro, bus, shuttle)
- Designated fan zones and their locations
- Parking capacity and ride-share zones

#### 4. FIFA's Sustainability & Accessibility Commitments
- Carbon neutrality goals
- Waste reduction initiatives
- Accessibility features promised (wheelchair access, sensory rooms, sign language)
- Digital accessibility (app features, multilingual support)

#### 5. Key Statistics for Our App
- Expected total attendance across the tournament
- Average match-day crowd per venue
- Number of volunteers expected
- Number of languages spoken by expected fan base

### Output Format

Use clean markdown with tables where appropriate. Organize by section headers. Cite sources where possible.

### Rules Reminder
- Do NOT modify any `.agents/` tracking files.
- Do NOT add placeholder data — only include verified information.
- If you cannot find specific data, note it as `[DATA NOT FOUND — needs manual verification]` rather than making it up.

---

## Task T-003: Crowd Management & Operational Intelligence Research

**Priority**: High  
**Deliverable**: Create the file `.agents/research/crowd_management_analysis.md` in the workspace `/Users/p.c.vsaiteja/Documents/fifa`

### What to Research

Search the web and compile a deep analysis document covering:

#### 1. Crowd Management Technologies
Research and analyze at least 3 platforms/technologies used for crowd management at large events:
- What sensors/data sources they use (CCTV, LiDAR, WiFi pings, ticket scans)
- How they measure crowd density and flow
- Real-time alerting capabilities
- Case studies from major sports events (Super Bowl, UEFA Champions League, Olympics)

#### 2. Key Metrics & Thresholds
Document the industry-standard metrics:
- Safe crowd density levels (persons per square meter)
- Gate entry flow rate benchmarks
- Average concession wait time thresholds
- Restroom queue management benchmarks
- Emergency evacuation time standards

#### 3. AI/ML in Crowd Analytics
Research how AI and machine learning are applied:
- Predictive crowd modeling (pre-event vs. real-time)
- Computer vision for density estimation
- NLP for sentiment analysis from social media during events
- Anomaly detection for security threats

#### 4. Real-Time Operational Dashboards
Analyze what the best operational dashboards show:
- Key widgets (heatmaps, flow arrows, alert panels, KPI cards)
- Data refresh rates (how often do dashboards update?)
- Multi-stakeholder views (what does security see vs. what does catering see?)

#### 5. Incident Response Protocols
- Standard operating procedures for crowd-related incidents
- Communication flows (command center → field staff → public)
- Escalation tiers (green / amber / red)

### Output Format

Use clean markdown with headers, bullet points, and tables. Include links to sources where available.

### Rules Reminder
- Do NOT modify any `.agents/` tracking files.
- Do NOT add placeholder data.
- Be thorough — this research directly shapes our product's core features.

---

After completing BOTH tasks, provide a completion report in this format:

```
## Task Completion Report

### Task: T-002 — FIFA World Cup 2026 Data Collection
### Files Created: `.agents/research/fifa_wc2026_data.md`
### Ready for Validation: Yes/No

### Task: T-003 — Crowd Management & Operational Intelligence Research
### Files Created: `.agents/research/crowd_management_analysis.md`
### Ready for Validation: Yes/No

### Known Limitations:
- <Any data gaps or uncertainties>
```
