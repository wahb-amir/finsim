# FinSim Backend (`@finsim/api`)

Express API that owns **authentication**, **game session lifecycle**, the **financial simulation engine**, and **AI features** (Socratic advisor + post-game debrief via Groq, with optional RAG over a Supabase pgvector knowledge base).

The frontend is a thin client: it sends choices and renders whatever the API returns. Never duplicate simulation logic in the web app.

---

## Table of contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Folder structure](#folder-structure)
- [Request flow](#request-flow)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Simulation engine](#simulation-engine)
- [AI & RAG](#ai--rag)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Development tips](#development-tips)

---

## Quick start

```bash
# From repo root
cp backend/.env.example backend/.env
# Set MONGO_URI and JWT_SECRET at minimum

pnpm install
pnpm dev:backend
```

Verify: `curl http://localhost:8081/api/health`

The API expects the frontend at `CLIENT_URL` (default `http://localhost:3000`) for CORS with credentials.

---

## Environment variables

Copy `backend/.env.example` → `backend/.env`. Keys must match exactly for production deploy validation.

| Variable              | Required | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `MONGO_URI`           | Yes      | MongoDB connection string                        |
| `PORT`                | Yes      | Listen port (default `8081` in example)          |
| `JWT_SECRET`          | Yes      | Secret for signing httpOnly auth cookies         |
| `NODE_ENV`            | Yes      | `development` or `production`                    |
| `CLIENT_URL`          | No       | Frontend origin for CORS (default `:3000`)       |
| `GROQ_API_KEY`        | For AI   | Groq API key for advisor + debrief               |
| `SUPABASE_URL`        | For RAG  | Supabase project URL                             |
| `SUPABASE_SERVICE_KEY`| For RAG  | Service role key (server-side only)              |
| `SUPABASE_ANON_KEY`   | For RAG  | Anon key (some RAG scripts)                      |

Without Groq/Supabase, core gameplay still works; advisor and debrief fall back or error depending on the code path.

---

## Folder structure

```text
backend/
├── server.js                     # Express app, middleware, route mounting, listen
├── .env.example
├── DEPLOY.md                     # GitHub Actions → VPS deployment
├── package.json
├── scripts/
│   ├── deploy.sh                 # Used by CI on the VPS
│   └── validate-env.sh           # Ensures .env keys match .env.example
└── src/
    ├── routes/
    │   ├── auth.js               # POST signin, login, logout; GET me
    │   ├── setup.js              # POST/PUT player setup profile
    │   ├── game.js               # Session CRUD, rounds, advisor, debrief
    │   └── ai.js                 # Standalone debrief endpoint
    ├── controller/
    │   ├── game.js               # Session lifecycle handlers
    │   ├── advisor.js            # On-demand advisor handler
    │   └── debrief.js            # Debrief generation handler
    ├── middleware/
    │   └── authMiddleware.js     # JWT from httpOnly cookie → req.user
    ├── Models/
    │   ├── auth.js               # User schema
    │   ├── setup.js              # Onboarding/setup profile
    │   ├── GameSession.js        # Authoritative session + simState
    │   └── Onboarding.js         # Extended onboarding data
    ├── services/
    │   ├── simulation/           # ★ Core game engine (see below)
    │   │   ├── index.js          # Re-exports engine + metrics helpers
    │   │   ├── engine.js         # createNewGame, applyChoice, events
    │   │   ├── events.js         # Event generation
    │   │   ├── scenarios.js      # Scenario definitions + modifiers
    │   │   ├── metrics.js        # toUIMetrics, deriveScenarioId, etc.
    │   │   ├── math.js           # Financial calculations
    │   │   ├── prng.js           # Deterministic randomness
    │   │   └── setupProfile.js   # Career/salary → starting state
    │   ├── debrief/              # Debrief payload building + persistence
    │   └── advisor/              # Advisor call counting + persistence
    ├── ai/
    │   ├── advisor.js            # Groq Socratic advisor prompt
    │   └── debrief.js            # Groq debrief generation prompt
    ├── rag/
    │   ├── knowledge/            # Source .txt + finsim-internal.json
    │   ├── chunk-knowledge.js    # Split sources into chunks
    │   ├── embed-and-seed.js     # Embed + upsert to Supabase
    │   ├── retriever.js          # Query pgvector at inference time
    │   ├── chunks.json           # Generated chunk manifest
    │   └── 001_pgvector.sql      # Supabase schema for embeddings
    └── utils/
        └── dbConnection.js         # Mongoose connect
```

---

## Request flow

```text
HTTP request
    │
    ▼
server.js
    ├── cors + json + cookie-parser
    ├── rate limiter (general / AI-specific)
    └── route mount
            │
            ├── /api/auth/*     → authMiddleware optional per route
            ├── /api/setup      → authMiddleware required
            ├── /api/game/*     → authMiddleware required
            └── /api/ai/*       → authMiddleware required
                    │
                    ▼
            controller/*.js
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Models/    services/      ai/ + rag/
   (MongoDB)  simulation     (Groq)
```

**Auth:** JWT stored in an httpOnly cookie named `token`. `authMiddleware` verifies it and attaches `req.user`.

**Game sessions:** `GameSession` stores `simState` (full internal simulation state), `currentEvent`, `currentNarrative`, and an append-only `rounds[]` audit trail. Clients receive **UI-shaped** metrics and events only — never raw `simState`.

---

## API reference

Base URL: `http://localhost:8081/api` (or your deployed host).

All game and setup routes require a valid auth cookie unless noted.

### Health

| Method | Path           | Auth | Description        |
| ------ | -------------- | ---- | ------------------ |
| GET    | `/health`      | No   | `{ success: true }`|

### Auth — mounted at `/api/auth`

| Method | Path       | Description                          |
| ------ | ---------- | ------------------------------------ |
| POST   | `/signin`    | Register `{ name, email, password }` |
| POST   | `/login`     | Log in `{ email, password }`         |
| GET    | `/me`        | Current user                         |
| POST   | `/logout`    | Clear auth cookie                    |

### Setup — mounted at `/api`

| Method | Path     | Body                              |
| ------ | -------- | --------------------------------- |
| POST   | `/setup` | `{ name, confidence, goal }`      |
| PUT    | `/setup` | Update existing setup             |

### Game — mounted at `/api/game`

| Method | Path                          | Description                                      |
| ------ | ----------------------------- | ------------------------------------------------ |
| POST   | `/session`                    | Start game — returns `sessionId`, event, metrics |
| POST   | `/session/round`              | Submit `{ sessionId, choice: "left"\|"right" }`  |
| POST   | `/session/:id/abandon`        | Exit without deleting history                    |
| POST   | `/session/:id/advisor`        | On-demand advisor (max 4 calls per session)      |
| GET    | `/session/:id`                | Reload active session view                       |
| GET    | `/session/:id/debrief`        | Lazy-generate + return debrief payload           |
| GET    | `/sessions`                   | List user's past sessions                        |
| GET    | `/sessions/userData`          | Aggregated stats for profile/dashboard           |

#### Create session — request body

```json
{
  "playerName": "Alex",
  "career": "Software Engineer",
  "startSalary": 75000,
  "goal": "build-wealth",
  "climateLabel": "Stable"
}
```

#### Create session — response shape

```json
{
  "success": true,
  "sessionId": "...",
  "currentRound": 1,
  "metrics": { "netWorth": 800, "creditScore": 680, "...": "..." },
  "event": { "id": "...", "title": "...", "left": {}, "right": {}, "crisis": false },
  "narrative": { "headline": "...", "advisorHint": "..." },
  "scenarioId": "baseline",
  "ageYears": 22
}
```

#### Submit round — response (in progress)

Same view fields as create, plus optional `debrief` snippet for the round just completed. When `completed: true` or `status: "completed"`, the client should navigate to debrief.

Full contract details and breaking-change history: [docs/MIGRATION-SERVER-AUTHORITATIVE-SIM.md](../docs/MIGRATION-SERVER-AUTHORITATIVE-SIM.md).

### AI — mounted at `/api/ai`

| Method | Path       | Description                    |
| ------ | ---------- | ------------------------------ |
| POST   | `/debrief`   | Standalone debrief generation  |

---

## Data models

### User (`Models/auth.js`)

Standard email/password account. Password hashed with bcrypt. Referenced by `GameSession.userId` and `Setup.userId`.

### Setup (`Models/setup.js`)

Player preferences from early onboarding: `name`, `confidence`, `goal`. One document per user.

### GameSession (`Models/GameSession.js`)

The central document. Important fields:

| Field               | Notes                                                |
| ------------------- | ---------------------------------------------------- |
| `userId`            | Owner — all queries scoped to authenticated user     |
| `status`            | `active` · `completed` · `abandoned`                 |
| `currentRound`      | 1–10 while playing; advances after each choice       |
| `simState`          | Full internal simulation state (server-only)         |
| `currentEvent`      | Event card shown to the player                       |
| `rounds[]`          | Audit trail: choice, metrics before/after, narrative |
| `advisorMessages[]` | Persisted advisor responses                          |
| `advisorCallsUsed`  | Cap at 4 per session                                 |
| `debriefPayload`    | Cached debrief once generated                        |

---

## Simulation engine

Location: `src/services/simulation/`

### Entry points

```js
const { createNewGame, applyChoice, deriveScenarioId, toUIMetrics } =
  require("./src/services/simulation");

// Start a session
const step = createNewGame({
  scenarioId: "baseline",
  seed: 12345,
  startSalary: 75000,
  climateLabel: "Stable",
  career: "Software Engineer",
});
// → { state, event, narrative, metrics }

// Apply a player choice
const next = applyChoice({ state: step.state, choice: "left" });
// → { state, event, narrative, metrics, completed?, debrief? }
```

### Scenarios

Defined in `scenarios.js`. IDs include:

- `baseline`
- `recession`
- `startup-founder`
- `immigrant-household`
- `single-parent`

`deriveScenarioId(session)` maps the player's `goal`, `climateLabel`, and `startSalary` to a scenario at session creation (same rules the old client used).

### Determinism

Each session gets `simSeed = hashStringToSeed(session._id)`. The PRNG in `prng.js` ensures the same session always produces the same event sequence for the same choices.

### Choices

The API accepts `"left"` / `"right"` (UI swipe directions). `"A"` / `"B"` are normalized for backward compatibility in round history storage.

### Smoke test

```bash
pnpm --filter @finsim/api test:sim
```

---

## AI & RAG

### Advisor (`src/ai/advisor.js`)

Triggered by `POST /api/game/session/:id/advisor`. The server builds context from:

- Current metrics and event
- Round history and detected mistake patterns
- User onboarding profile
- Retrieved knowledge chunks (RAG)

Returns a Socratic question — not direct advice. Limited to **4 calls per game session**.

### Debrief (`src/ai/debrief.js` + `services/debrief/`)

Generated lazily on `GET /api/game/session/:id/debrief` and cached on the session document. Includes verdict, round-by-round optimal comparison, and net worth progression data for the chart.

### RAG pipeline

```bash
# From backend/ — requires Supabase + env vars
pnpm chunk          # knowledge/*.txt → chunks.json
pnpm seed           # embed chunks → Supabase
pnpm seed:fresh     # drop + re-seed
pnpm build-kb       # chunk + fresh seed
```

Knowledge sources live in `src/rag/knowledge/` (credit scores, compound interest, debt, taxes, investing, insurance, behavioral finance, plus `finsim-internal.json`).

Schema: `src/rag/001_pgvector.sql` — run once in Supabase.

---

## Scripts

| Script              | Command                              | Purpose                    |
| ------------------- | ------------------------------------ | -------------------------- |
| Dev server          | `pnpm dev`                           | `node --watch server.js`   |
| Production          | `pnpm start`                         | `node server.js`           |
| Chunk knowledge     | `pnpm chunk`                         | Build `chunks.json`        |
| Seed embeddings     | `pnpm seed` / `pnpm seed:fresh`      | Upsert to Supabase         |
| Simulation smoke    | `pnpm test:sim`                      | Quick engine sanity check  |

---

## Deployment

Production deployment uses PM2 (`ecosystem.config.cjs` at repo root) and GitHub Actions. Full VPS setup, secrets, and nginx notes:

**[DEPLOY.md](./DEPLOY.md)**

---

## Development tips

1. **Change simulation behavior** → edit `src/services/simulation/` only. Run `pnpm test:sim` after changes.
2. **Add a new API route** → create handler in `controller/`, wire in `routes/`, mount in `server.js`.
3. **New persisted field on sessions** → update `Models/GameSession.js` and the relevant controller; avoid sending internal fields in JSON responses (use `toPublicSession` helpers in `services/debrief/`).
4. **AI prompt tuning** → `src/ai/advisor.js` and `src/ai/debrief.js`; keep business logic out of prompt strings where possible.
5. **Rate limits** → general limiter on `/api/*`; tighter `aiLimiter` on `/api/ai` and advisor calls.
6. **Auth debugging** → confirm cookie `token` is set with `credentials: "include"` from the frontend and `CLIENT_URL` matches the browser origin.

For frontend integration patterns (how pages call these endpoints), see [frontend/README.md](../frontend/README.md).
