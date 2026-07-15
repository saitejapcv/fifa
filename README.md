# FIFA 2026 Smart Stadium — AI Operations Center

Minimal, Claude-inspired redesign of the Smart Stadium operations dashboard.

**Stack:** Next.js (App Router) · Prisma (SQLite) · Tailwind CSS · Framer Motion

## Features

- Live crowd simulation with sector density map
- AI decision feed (local rules engine + optional Gemini)
- Incident command with auto-triage
- Gate flow optimizer and queue predictions
- Transit, sustainability, accessibility, volunteer dispatch
- Role modes: Fan / Staff / Organizer
- Prisma-backed stadiums and incident persistence

## Design

- Warm cream palette and coral accent (Claude-like)
- Newsreader (serif headings) + Inter (UI)
- Soft cards, generous whitespace, springy page transitions

## Getting started

```bash
npm install
npm run db:setup    # prisma db push + seed stadiums
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env` (default SQLite path is fine):

```
DATABASE_URL="file:./dev.db"
```

### Gemini (optional)

Settings → paste a Gemini API key. Stored in `localStorage` only. Without a key, the local AI engine answers.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | Create DB + seed stadiums |
| `npm run db:seed` | Re-seed data |

## Project layout

```
src/
  app/              # App Router pages + API routes
  components/       # UI shell, views, map, chat
  context/          # Client app state + simulator bridge
  lib/              # Prisma, AI engine, simulator, Gemini
prisma/             # Schema + seed
legacy/             # Original static SPA (reference)
```

## Legacy app

The original vanilla HTML/CSS/JS app lives in `legacy/` for reference.
