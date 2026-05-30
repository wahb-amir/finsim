# FinSim Frontend (`@finsim/web`)

Next.js 16 App Router application for the FinSim player experience. This package **renders server state** and **collects player input** — it does not run the financial simulation.

All round outcomes, metrics, and events come from `@finsim/api`. Local state (`GameContext`) is a view layer that hydrates from API responses and tracks UI-only concerns (selected choice, advisor panel open, etc.).

---

## Table of contents

- [Quick start](#quick-start)
- [Environment](#environment)
- [Folder structure](#folder-structure)
- [Routes & user flows](#routes--user-flows)
- [Data flow](#data-flow)
- [State management](#state-management)
- [API integration](#api-integration)
- [Key components](#key-components)
- [Design system](#design-system)
- [Path aliases & conventions](#path-aliases--conventions)
- [Development tips](#development-tips)

---

## Quick start

```bash
# From repo root — backend must be running (see backend/README.md)
pnpm install

# Create frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8081/api

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api
```

All authenticated API calls use `credentials: "include"` so the backend's httpOnly JWT cookie is sent automatically.

The shared constant lives in `components/game/constants.js`:

```js
export const API = process.env.NEXT_PUBLIC_API_URL;
```

---

## Folder structure

```text
frontend/
├── app/                              # Next.js App Router
│   ├── layout.jsx                    # Root layout, fonts, providers
│   ├── globals.css                   # Design tokens, animations
│   ├── page.jsx                      # Landing (/)
│   ├── auth/page.jsx                 # Sign up / log in
│   ├── dashboard/page.jsx            # Session history hub
│   ├── setup/page.jsx                # New game configuration
│   ├── game/page.jsx                 # Game board (wraps GameContent)
│   ├── debrief/page.jsx              # Post-game analysis + chart
│   ├── profile/page.jsx              # Account + stats
│   ├── leaderboard/page.jsx          # Mock leaderboard
│   ├── onboarding/page.jsx           # Alternate onboarding flow
│   ├── icon.svg                      # App icon
│   └── context/
│       └── AuthContext.js            # User session (JWT cookie)
│
├── components/
│   ├── providers/
│   │   └── AppProviders.jsx          # Wraps GameProvider
│   ├── brand/
│   │   └── BrandLogo.jsx             # Shared logo mark
│   ├── layout/
│   │   ├── AppNavbar.jsx             # Authenticated nav
│   │   └── HeaderFooter.jsx          # Marketing layout shell
│   ├── game/                         # Game board building blocks
│   │   ├── GameContent.jsx           # ★ Main game orchestrator
│   │   ├── GameHeader.jsx
│   │   ├── GameMetricsSidebar.jsx
│   │   ├── GameRoundPanel.jsx
│   │   ├── GameFooter.jsx
│   │   ├── GameLoadingScreen.jsx
│   │   ├── GameToast.jsx
│   │   ├── CreditBadge.jsx
│   │   ├── SwipeDecisionCard.tsx     # Swipe / click decisions
│   │   └── constants.js              # TOTAL_ROUNDS, API base URL
│   ├── ui/                           # Reusable UI primitives
│   │   ├── MetricCard.jsx
│   │   ├── AdvisorPanel.jsx
│   │   ├── NetWorthChart.jsx
│   │   ├── BottomSheet.tsx           # Mobile advisor drawer
│   │   ├── Modal.jsx / ConfirmModal.jsx
│   │   └── ...
│   ├── dashboard/
│   │   └── SessionDetailModal.jsx
│   ├── sections/
│   │   └── CoreSections.jsx          # Landing page sections
│   └── features/
│       └── InteractiveTools.jsx
│
├── context/
│   └── GameContext.jsx               # Client game view state (reducer)
│
├── hooks/
│   └── useGameSession.js             # Load + hydrate session from API
│
├── lib/
│   ├── api.js                        # Advisor request + legacy mocks
│   ├── data.js                       # Static marketing / landing data
│   ├── format.js                     # Currency, label formatters
│   └── game-types.ts                 # Shared TypeScript types
│
├── public/                           # Static assets
├── next.config.ts
├── tsconfig.json                     # @/* path alias
└── package.json
```

---

## Routes & user flows

| Route          | File                       | Auth | What happens                                              |
| -------------- | -------------------------- | ---- | --------------------------------------------------------- |
| `/`            | `app/page.jsx`             | No   | Marketing landing                                         |
| `/auth`        | `app/auth/page.jsx`        | No   | Register or log in → redirect to `/dashboard`             |
| `/dashboard`   | `app/dashboard/page.jsx`   | Yes  | List sessions, resume active, start new                   |
| `/setup`       | `app/setup/page.jsx`       | Yes  | Pick career, salary, goal, climate → `POST /game/session` |
| `/game`        | `app/game/page.jsx`        | Yes  | Play rounds; `?sessionId=` or localStorage fallback       |
| `/debrief`     | `app/debrief/page.jsx`     | Yes  | Fetch debrief; `?sessionId=` required                     |
| `/profile`     | `app/profile/page.jsx`     | Yes  | User stats from `/game/sessions/userData`                 |
| `/leaderboard` | `app/leaderboard/page.jsx` | No   | Uses `MOCK_LEADERBOARD` from `lib/api.js`                 |

### Typical new-player flow

```text
/auth (create account)
  → /dashboard
  → /setup (POST /api/game/session)
  → /game?sessionId=<id>
  → [10 rounds: POST /api/game/session/round]
  → /debrief?sessionId=<id>
  → /dashboard
```

### Returning player

`/dashboard` lists sessions. An **active** session can be resumed via `/game?sessionId=...`. **Completed** sessions link to debrief. **Abandoned** sessions appear in history but cannot be resumed.

---

## Data flow

```text
┌──────────────────────────────────────────────────────────────┐
│  Page (setup, game, debrief, dashboard)                      │
└─────────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   AuthContext     GameContext     useGameSession
   (who am I?)     (what do I      (load session
                    see on screen?)  from API)
          │               ▲               │
          │               │               │
          └─────── fetch ─┴───────────────┘
                          │
                          ▼
              NEXT_PUBLIC_API_URL
              (http://localhost:8081/api)
                          │
                          ▼
                   Express backend
```

### Session lifecycle (game page)

1. **`useGameSession`** reads `sessionId` from URL, route params, or `localStorage`.
2. **`GET /game/session/:id`** returns current metrics, event, narrative, round number.
3. **`hydrateGameView`** dispatches into `GameContext` — UI re-renders.
4. Player picks **left/right** → stored as `selectedChoice` in context.
5. **`handleConfirm`** in `GameContent.jsx` → **`POST /game/session/round`** with `{ sessionId, choice }`.
6. Response hydrates the next round, or redirects to `/debrief` if completed.
7. Optional: **`requestAdvisor(sessionId)`** from `lib/api.js` → **`POST /game/session/:id/advisor`**.

The frontend never sends computed metrics back to the server.

---

## State management

Two React contexts, mounted in `app/layout.jsx`:

### AuthContext (`app/context/AuthContext.js`)

- `user`, `loading`, `isAuthenticated`
- `fetchMe()` — `GET /auth/me` on mount
- `login`, `logout`, `setUser`
- Redirect unauthenticated users away from protected pages

### GameContext (`context/GameContext.jsx`)

Client-side **view state** only:

| State field        | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `playerName`       | Display name                                     |
| `currentRound`     | Round indicator (1–10)                           |
| `metrics`          | UI-shaped numbers from API                       |
| `currentEvent`     | Event card (title, left/right options)           |
| `currentNarrative` | Headline + advisor hint                          |
| `selectedChoice`   | `"left"` or `"right"` before confirm             |
| `roundHistory`     | Client-side snapshots for UI (not authoritative) |
| `advisorMessages`  | Display list (also persisted server-side)        |
| `debriefData`      | Cached debrief payload                           |

Key actions: `hydrateGameView`, `selectChoice`, `recordRoundSnapshot`, `setDebriefData`, `resetGame`.

`AppProviders` wraps children with `GameProvider` only; `AuthProvider` sits alongside it in the root layout.

---

## API integration

Every authenticated request pattern:

```js
const res = await fetch(`${API}/game/session/${sessionId}`, {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
});
const data = await res.json();
if (!res.ok || !data?.success) {
  /* handle error */
}
```

### Endpoints used by the frontend

| Feature         | Method | Path                        | Used in                  |
| --------------- | ------ | --------------------------- | ------------------------ |
| Auth check      | GET    | `/auth/me`                  | AuthContext              |
| Register        | POST   | `/auth/signin`              | auth/page                |
| Login           | POST   | `/auth/login`               | auth/page                |
| Logout          | POST   | `/auth/logout`              | AuthContext, profile     |
| Create session  | POST   | `/game/session`             | setup/page               |
| Submit choice   | POST   | `/game/session/round`       | GameContent              |
| Load session    | GET    | `/game/session/:id`         | useGameSession           |
| Abandon session | POST   | `/game/session/:id/abandon` | GameContent              |
| Advisor         | POST   | `/game/session/:id/advisor` | lib/api.js, AdvisorPanel |
| Debrief         | GET    | `/game/session/:id/debrief` | debrief/page             |
| List sessions   | GET    | `/game/sessions`            | dashboard, setup         |
| User stats      | GET    | `/game/sessions/userData`   | profile, dashboard       |

### Legacy / mock layer (`lib/api.js`)

Still contains `MOCK_ROUNDS`, `MOCK_LEADERBOARD`, and `getFinalDebrief` for reference and the leaderboard page. **Live gameplay does not use mock rounds.** Prefer `requestAdvisor(sessionId)` over deprecated `getAdvisorMessage`.

---

## Key components

### Game board (`components/game/`)

```text
┌─────────────┬──────────────────────────────┬────────────────┐
│  Sidebar    │       Center Panel           │  Right Panel   │
│  ~260px     │       flex-1                 │  ~320px        │
│             │                              │                │
│  Metrics    │  Round header + age          │  AdvisorPanel  │
│  (8 cards)  │  SwipeDecisionCard           │  (desktop)     │
│             │  [Confirm Decision]          │  BottomSheet   │
│             │                              │  (mobile)      │
└─────────────┴──────────────────────────────┴────────────────┘
         ●●●●●◉●●●●   RoundProgress (GameFooter)
```

- **`GameContent.jsx`** — orchestrates session loading, round submission, exit flow, advisor state.
- **`SwipeDecisionCard.tsx`** — Framer Motion swipe gestures + keyboard support.
- **`AdvisorPanel.jsx`** — calls `requestAdvisor`; shows Socratic messages.
- Crisis events render a **CRISIS** badge via `currentEvent.crisis`.

### Layout & brand

- **`AppNavbar.jsx`** — authenticated pages (dashboard, profile).
- **`HeaderFooter.jsx`** — marketing shell on landing.
- **`BrandLogo.jsx`** — shared SVG logo.

### Dashboard

- **`SessionDetailModal.jsx`** — drill into a past session's rounds and metrics.

---

## Design system

Defined in `app/globals.css` and used via Tailwind utility classes:

| Token   | Value     | Usage                          |
| ------- | --------- | ------------------------------ |
| Base    | `#0A0A0A` | Page background                |
| Surface | `#111111` | Cards, panels                  |
| Border  | `#1F1F1F` | Dividers                       |
| Accent  | `#F59E0B` | Primary actions, active states |
| Success | `#10B981` | Positive metrics               |
| Danger  | `#EF4444` | Crisis, errors                 |
| Text    | `#F5F5F5` | Primary copy                   |
| Muted   | `#A1A1A1` | Secondary copy                 |

**Fonts:** Syne (headings), DM Sans (body) — loaded in `layout.jsx`.

---

## Path aliases & conventions

`tsconfig.json` maps `@/*` → project root:

```js
import { useGame } from "@/context/GameContext";
import { MetricCard } from "@/components/ui/MetricCard";
```

- **Pages** in `app/` — default exports, `"use client"` where hooks are needed.
- **Shared UI** in `components/` — grouped by domain (`game/`, `ui/`, `layout/`).
- **Mixed JS/TS** — new interactive components can be `.tsx`; pages remain mostly `.jsx`.
- **No simulation imports** — if you find yourself importing math or PRNG code, it belongs in the backend.

---

## Development tips

1. **Backend must be running** for auth, setup, game, and debrief. Mock data only covers leaderboard and deprecated helpers.
2. **Session ID persistence** — stored in URL (`?sessionId=`) and `localStorage` key `gameSessionId` for reload resilience.
3. **Auth redirects** — game and debrief pages redirect to `/auth` if `user` is null after loading.
4. **Completed session guard** — `useGameSession` redirects completed sessions straight to debrief.
5. **Adding a page** — create `app/your-route/page.jsx`, wrap with `AppNavbar` if authenticated, use `useAuth()` for gating.
6. **Changing metrics display** — edit sidebar/panel components; metric _values_ come from API field names in `metrics` object.
7. **Testing advisor/debrief locally** — requires backend `GROQ_API_KEY` (and Supabase for RAG-enhanced advisor).

For simulation rules, API contracts, and AI pipeline details, see [backend/README.md](../backend/README.md).

For monorepo overview and architecture diagram, see [README.md](../README.md).
