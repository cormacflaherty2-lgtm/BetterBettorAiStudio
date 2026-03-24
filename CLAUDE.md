# CLAUDE.md — BetterBettor AI Studio

This file provides context and conventions for AI assistants working in this codebase.

---

## Project Overview

**BetterBettor** is an AI-powered NBA player prop betting insights web application. It surfaces edge analysis, projected points, tier rankings, and confidence scores to help users make informed betting decisions.

- **App Name:** Better Bettor
- **App ID (AI Studio):** `bbb2aada-041f-41de-9ff9-c65b2200ec40`
- **Deployment:** Anthropic AI Studio

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Node.js + Express 4, TypeScript via `tsx` |
| AI/ML | `@google/genai` 1.29 (Google Generative AI) |
| Data Source | Google Sheets (via Google APIs service account) |
| Local DB | better-sqlite3 (installed, reserved for future use) |
| Auth | Google OAuth 2 (skeleton implemented) |
| Routing | React Router DOM 7 |
| Animation | Motion (Framer Motion v12 successor) |
| Charts | Recharts 3 |
| Icons | Lucide React |

---

## Directory Structure

```
/
├── src/
│   ├── screens/         # Full-page route components
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers (global state)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API clients and data fetching
│   ├── lib/             # Utility functions (cn(), etc.)
│   ├── types.ts         # All shared TypeScript types/interfaces
│   ├── mockData.ts      # Static mock data for development/fallback
│   ├── App.tsx          # Root component with router setup
│   ├── main.tsx         # React DOM entry point
│   └── index.css        # Tailwind base + custom CSS variables
├── server.ts            # Express server (dev middleware + API routes)
├── vite.config.ts       # Vite + React + Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── index.html           # HTML shell
├── metadata.json        # AI Studio app metadata
└── .env.example         # Environment variable template
```

---

## Development Commands

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (Express + Vite middleware)
npm run build       # Production build → /dist
npm run preview     # Preview production build locally
npm run lint        # TypeScript type-check (tsc --noEmit)
npm run clean       # Remove /dist
```

The dev server runs `server.ts` via `tsx`. Express serves Vite as middleware in development and static `/dist` files in production.

---

## Environment Variables

Copy `.env.example` to `.env` and populate:

```bash
# Google Sheets data pipeline (server-side only)
VITE_SHEET_ID=
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=
VITE_GOOGLE_PRIVATE_KEY=

# Google OAuth (for user login, skeleton impl)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Session
SESSION_SECRET=

# Injected by AI Studio automatically
GEMINI_API_KEY=
```

> **Note:** `VITE_GOOGLE_PRIVATE_KEY` is used server-side despite the `VITE_` prefix. Do not expose private keys in client-side bundles.

---

## API Routes (server.ts)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check + config status |
| GET | `/api/auth/google/url` | Generate Google OAuth redirect URL |
| GET | `/api/auth/google/callback` | OAuth callback (skeleton) |
| GET | `/api/player-props` | Fetch player props from Google Sheets |

---

## Data Model

### `PlayerProp` (core entity)

```typescript
interface PlayerProp {
  id: string;
  player: string;
  playType: string;         // e.g. "Points", "Rebounds"
  line: number;             // Sportsbook line
  projectedPts: number;     // Model projection
  diff: number;             // projectedPts - line (the edge)
  tier: string;             // S / A / B / C / D
  score: number;
  team: string;
  opponent: string;
  hitRateL10: number;       // Hit rate over last 10 games
  hitRateDisplay: string;
  confidence: string;
  algoRecord: string;
  modelRecord: string;
  lastResult: string;
  algoModelBlend: string;
  tierRank: number;
  last10Games: number[];    // Actual stat values for last 10 games
  edgeDisplay: string;
  valueLabel: string;
  isHighValue: boolean;
}
```

Google Sheets data is mapped from 50+ columns (A–AZ) to this interface in `server.ts`. Columns 36–45 are the last 10 game stats.

---

## Frontend Conventions

### Component Style

- **All components:** functional, typed with `React.FC<Props>` or explicit return types
- **File location:** `src/components/` for reusable UI, `src/screens/` for route-level pages
- **Naming:** PascalCase for component files and exports

```typescript
export const ComponentName: React.FC<Props> = ({ prop }) => {
  // hooks at top
  // handlers
  // return JSX
};
```

### Styling

- **Framework:** Tailwind CSS 4 (no `tailwind.config.js` — config is in `vite.config.ts`)
- **Utility:** Use `cn()` from `src/lib/utils.ts` for conditional class merging (wraps `clsx` + `tailwind-merge`)
- **Layout:** Mobile-first, max width `390px`, centered
- **Dark theme only:** Do not add light mode

**Color palette (CSS variables / Tailwind tokens):**

| Token | Hex | Usage |
|-------|-----|-------|
| `canvas` | `#080D1A` | App background |
| `surface` | `#0F1629` | Card/panel backgrounds |
| `accent` | `#7C3AED` | Primary purple (CTAs, highlights) |
| `positive` | `#4ADE80` | Green — wins, positive edge |
| `negative` | `#F87171` | Red — losses, negative |

**Font:** Inter (loaded via Google Fonts in `index.html`)

### State Management

- **Local state:** `useState` / `useReducer` in components
- **Global state:** React Context in `src/context/`
- **Data fetching:** Custom hook `src/hooks/usePlayerProps.ts` (fetches `/api/player-props`)
- No Redux or Zustand — keep it simple unless scale requires it

### Routing

React Router DOM 7 is used. Routes are defined in `src/App.tsx`. Add new screens there.

---

## Backend Conventions

- `server.ts` is the single Express entry point
- All API routes are prefixed `/api/`
- Vite dev middleware is applied in non-production mode
- Production: serves static `/dist` from Express
- HMR is disabled in AI Studio via `DISABLE_HMR` env var

---

## Google Sheets Integration

The data pipeline reads from a Google Sheet using a service account:

1. Auth via `google-auth-library` JWT with `spreadsheets.readonly` scope
2. Fetches range `{sheetName}!A1:AZ500`
3. Row 1 is treated as header (skipped)
4. Each row is mapped to a `PlayerProp` object

If the Sheet ID or credentials are missing, the `/api/player-props` endpoint falls back gracefully (returns empty array or error).

---

## Tier System

Props are classified S → D:

| Tier | Meaning |
|------|---------|
| S | Highest confidence, strongest edge |
| A | High value |
| B | Moderate value |
| C | Low value |
| D | Avoid / below threshold |

Tier rank is numeric (1 = S). Used for sorting and visual priority.

---

## No Testing Framework

There is currently no test suite. Use `npm run lint` (`tsc --noEmit`) for type safety validation. When adding tests, prefer **Vitest** (compatible with the existing Vite setup).

---

## Things to Avoid

- Do not expose `VITE_GOOGLE_PRIVATE_KEY` or other secrets in client-side code
- Do not add a light color theme — the app is dark-only
- Do not add Redux or other heavy state libraries without discussion
- Do not modify the `dist/` directory directly — it is build output
- Do not commit `.env` files
- HMR is intentionally disabled in AI Studio — do not re-enable it in that env

---

## Git Workflow

- Default development branch: `master`
- Feature branches follow: `claude/<description>-<id>` pattern (AI Studio convention)
- Commit messages should be clear and describe the "why", not just the "what"
