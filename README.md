# FIFA 2026 Smart Stadium — AI Operations Center

A state-of-the-art GenAI-enabled stadium operations and fan experience portal designed for the **FIFA World Cup 2026**. Built to optimize crowd safety, multilingual support, step-free accessibility, and real-time incident command.

**Stack:** Next.js (App Router) · Prisma ORM · Neon PostgreSQL · Tailwind CSS · Framer Motion · Gemini 2.5 Flash

---

## 🌟 Hackathon Goal & Product Impact Alignment

This application addresses the core challenge of **Smart Stadiums & Tournament Operations** by providing a comprehensive, multi-role intelligence center that utilizes Generative AI across several key areas:

### 1. 🎙️ Multimodal Voice Translation (Fans & Volunteers)
*   **The Problem:** Over 10 million fans from 48 countries will attend matches across 16 North American host cities in 2026. Language barriers can slow down gate entry, food services, and emergency responses.
*   **The GenAI Solution:** An on-the-fly audio translator utilizing the **Gemini 2.5 Flash** model. It records high-fidelity audio chunks, transcribes the voice input in the fan's native tongue, translates the transcript into the target language (e.g., English, Spanish, French, German), and automatically plays back the audio using synthetic Text-to-Speech (TTS).
*   **Location:** [translate-view.tsx](file:///Users/p.c.vsaiteja/Documents/fifa/src/components/views/translate-view.tsx)

### 2. 🛗 Step-Free Accessibility Routing (Fans & Staff)
*   **The Problem:** Navigation within massive 80,000-seat venues is challenging for visitors with limited mobility, wheelchair users, and families with strollers.
*   **The GenAI Solution:** The **Accessibility Center** uses AI reasoning to plan step-by-step evacuation routes and gate entry paths that are 100% step-free, dynamically routing fans away from stairs, escalators, and live crowd blockages.
*   **Location:** [accessibility-view.tsx](file:///Users/p.c.vsaiteja/Documents/fifa/src/components/views/accessibility-view.tsx)

### 3. 📄 Bulk Roster Intelligence (Event Organizers)
*   **The Problem:** Managing volunteer assignments, staff credentials, and tickets across different matches involves parsing unstructured Excel, CSV, or text rosters.
*   **The GenAI Solution:** An AI-powered CSV/unstructured text parser. Organizers can drag-and-drop any roster text file. Gemini extracts structured ticket data, matching seat IDs, volunteer assignments, and staff credentials, and directly persists them to Neon PostgreSQL via Prisma.
*   **Location:** [settings-view.tsx](file:///Users/p.c.vsaiteja/Documents/fifa/src/components/views/settings-view.tsx)

### 4. 🚨 Real-time Incident Command (Venue Staff)
*   **The Problem:** Stadium incidents (e.g., medical issues, wet floor spills, gate queues) must be triaged instantly to prevent crowd crushes.
*   **The GenAI Solution:** Real-time auto-triage. When fans report incidents, the AI calculates severity levels, suggests containment protocols, and automatically maps matching volunteers based on location and proximity.
*   **Location:** [incidents-view.tsx](file:///Users/p.c.vsaiteja/Documents/fifa/src/components/views/incidents-view.tsx)

---

## 👥 Targeted Personas

The application features three tailorable user views, accessible via the top-right role selector:

*   **Fans:** Access digital tickets, view nearest food/bathroom queue wait times, request step-free routing, and use the multilingual translator tool.
*   **Venue Staff:** Monitor crowd densities per sector, track incident command tickets, dispatch field volunteers, and view AI-predicted gate queues.
*   **Tournament Organizers:** Oversee stadium capacities, manage bulk roster uploads (ticket/staff data), modify volunteer databases, and view composite venue sustainability scores.

---

## 🛠️ Getting Started & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/saitejapcv/fifa.git
cd fifa
npm install
```

### 2. Configure Database & Environment
Copy the example environment file and define your connection strings. The project is pre-configured with a Neon serverless PostgreSQL database:
```bash
cp .env.example .env
```
Inside `.env`:
```env
DATABASE_URL="postgresql://neondb_owner:npg_kUryI9V6jHpe@ep-gentle-credit-azp2gw5j.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Initialize Prisma Database & Seed Data
Generate the Prisma Client, push the schema migrations to Neon, and seed initial stadiums:
```bash
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🧪 Verification & Testing

Verify code quality, accessibility semantics, and end-to-end user flows with our test suites:

*   `npm run test`: Runs unit tests validating simulator behavior and AI decision algorithms.
*   `npm run test:e2e`: Launches Playwright tests validating translation flows and view routing in headless Chromium.
*   `npm run verify:full`: Executes type checks, unit tests, and E2E tests for continuous validation.

---

## 📁 Repository Map

```
src/
  app/              # API routes (chat, worldcup, incident trackers) + layout router
  components/       # UI library components, header shell, sidebar, and views
    views/          # Personas-oriented views (accessibility, incidents, transit, etc.)
  context/          # Global application state provider & live simulation bridge
  lib/              # Prisma client, simulation math, and Gemini API bindings
prisma/             # Schema + seed
```
