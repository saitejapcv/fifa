# 🎨 OPENCODE — Research Task Prompt (T-004)

> **Paste the `opencode_system_prompt.md` FIRST, then paste this prompt.**

---

You have been assigned **one research task** by the Orchestrator (Antigravity).

---

## Task T-004: UI/UX Component Analysis of FIFA & Stadium Websites

**Priority**: Medium  
**Deliverable**: Create the file `.agents/research/ui_component_analysis.md` in the workspace `/Users/p.c.vsaiteja/Documents/fifa`

### What to Research

Search the web and analyze the UI/UX patterns of FIFA-related and smart stadium websites and apps. We are building a premium "Smart Stadium Operations Center" dashboard and need design inspiration.

#### 1. Reference Websites to Analyze
Study the following (and any other relevant ones you find):
- **FIFA.com** — Official FIFA World Cup pages (schedules, stadiums, tickets)
- **UEFA.com** — Champions League match center and live dashboards
- **NFL GameDay** or **NBA Arena Apps** — In-venue fan experience features
- **Wembley Connected Stadium** or **SoFi Stadium App** — Smart stadium operations
- **Any crowd management dashboard** you can find screenshots or demos of

For each, document:
- Overall design language (color palette, typography, layout grid)
- Navigation patterns (sidebar, top nav, tabs, bottom bar)
- Key UI components used
- How they handle real-time data display
- Mobile responsiveness approach

#### 2. UI Component Inventory
Create a list of reusable components we should build, organized by category:

**Navigation & Layout**
- Sidebar navigation with role switching
- Top bar with live clock, alerts, and user profile
- Responsive grid layout system

**Data Display**
- KPI cards (crowd count, queue times, incidents)
- Heatmap overlays on stadium maps
- Real-time charts (line, bar, gauge)
- Status indicators (green/amber/red dots)
- Live feed / activity log

**Interactive Elements**
- Stadium map (SVG-based or Canvas) with clickable sectors
- AI chat interface (message bubbles, typing indicator, suggested prompts)
- Settings panel (API key input, role selector, theme toggle)
- Modal dialogs for incident details
- Toast notifications for alerts

**Accessibility & Multilingual**
- Language selector dropdown
- High-contrast mode toggle
- Font size adjuster
- Screen reader-friendly patterns (ARIA roles)

#### 3. Color Palette Recommendations
Based on your analysis, recommend:
- A **primary dark theme** palette (background, surface, card, text)
- **Accent colors** (success green, warning amber, danger red, info blue)
- **FIFA-branded** accent (gold, green, white)
- How gradients and glassmorphism should be applied

#### 4. Typography Recommendations
- Recommend 2–3 Google Fonts that pair well for a premium dashboard
- Heading, body, and mono (for data) font pairings
- Font size scale (headings, body, captions, labels)

#### 5. Interaction Patterns & Micro-Animations
Document the best interaction patterns seen:
- Hover effects on cards and buttons
- Transition animations for view switching
- Loading states and skeleton screens
- Data update animations (number counters, chart transitions)
- Notification slide-in/fade-out

### Output Format

Use clean markdown with:
- Tables for component inventories
- Hex color codes for palette recommendations
- Links to reference sites where applicable
- Organized sections matching the structure above

### Rules Reminder
- Do NOT modify any `.agents/` tracking files.
- Do NOT add placeholder recommendations — base everything on actual analysis.
- Focus on premium, modern, dark-mode dashboard aesthetics.
- Think "mission control center" meets "FIFA glamour."

---

After completing the task, provide a completion report:

```
## Task Completion Report

### Task: T-004 — UI/UX Component Analysis of FIFA & Stadium Websites
### Files Created: `.agents/research/ui_component_analysis.md`

### Design Recommendations Summary:
- <Key takeaways>

### Known Limitations:
- <Any sites you couldn't access or analyze>

### Ready for Validation: Yes
```
