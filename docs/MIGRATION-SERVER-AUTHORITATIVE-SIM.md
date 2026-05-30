# Migration: Server-authoritative simulation

FinSim’s financial simulation now runs entirely on the backend. The frontend only renders API responses and sends player choices.

## Summary of architectural change

| Layer          | Before                                     | After                                          |
| -------------- | ------------------------------------------ | ---------------------------------------------- |
| Simulation     | `frontend/lib/sim/*` (client)              | `backend/src/services/simulation/*` (server)   |
| Round outcomes | Client computed, sent as `metricsAfter`    | Server computes and persists                   |
| Session state  | Not stored (client replayed rounds)        | `GameSession.simulationState` + `currentEvent` |
| Choices        | Mixed `left`/`right` (UI) and `A`/`B` (DB) | `left` / `right` everywhere                    |

---

## API contract changes

### `POST /api/game/session`

**Before**

```json
// Request (unchanged fields)
{
  "career": "Software Engineer",
  "startSalary": 50000,
  "goal": "build-wealth",
  "climateLabel": "Stable"
}

// Response
{
  "success": true,
  "sessionId": "<id>",
  "session": { /* full Mongo document, no event/metrics */ }
}
```

**After**

```json
// Request — unchanged
{
  "career": "Software Engineer",
  "startSalary": 50000,
  "goal": "build-wealth",
  "climateLabel": "Stable"
}

// Response
{
  "success": true,
  "sessionId": "<id>",
  "currentRound": 1,
  "metrics": { /* UI-shaped metrics, see below */ },
  "event": { /* EventCard */ },
  "narrative": {
    "headline": "…",
    "advisorHint": "…"
  },
  "scenarioId": "baseline",
  "ageYears": 22
}
```

**Breaking:** `session` full document is no longer returned on create. Clients must use `sessionId` and optionally `GET /api/game/session/:id`.

**Server behavior:** Creates `simulationState`, rolls the first event, stores `currentEvent` / `currentNarrative`, derives `scenarioId` from `goal` + `climateLabel` + `startSalary` (same rules as the old client `deriveScenarioId`).

---

### `POST /api/game/session/round`

**Before**

```json
// Request — all required
{
  "sessionId": "<id>",
  "round": 3,
  "title": "Event title",
  "choice": "A",
  "metricsAfter": {
    "netWorth": 1200,
    "creditScore": 680,
    /* … client-computed snapshot … */
  },
  "optimalComparison": { /* optional, round 10 only */ }
}

// Response
{
  "success": true,
  "currentRound": 4,
  "session": { /* full document */ }
}
```

**After**

```json
// Request — only these fields
{
  "sessionId": "<id>",
  "choice": "left"
}

// choice must be "left" or "right" (not "A" / "B")

// Response
{
  "success": true,
  "currentRound": 4,
  "metrics": { /* UI-shaped metrics */ },
  "event": { /* next EventCard, null if completed */ },
  "narrative": { "headline": "…", "advisorHint": "…" },
  "debrief": { /* optional RoundDebrief after a choice */ },
  "status": "active",
  "completed": false,
  "ageYears": 22.08,
  "scenarioId": "baseline"
}
```

**Removed request fields:** `round`, `title`, `metricsAfter`, `optimalComparison`.

**Breaking:** Sending `metricsAfter` is ignored (and must not be relied upon). Round number is inferred from `session.currentRound`.

**Round 10:** Server sets `status: "completed"`, `finalMetrics`, `event: null`, `completed: true`.

---

### `GET /api/game/session/:id`

**Before**

```json
{
  "success": true,
  "session": {
    /* Mongo document only */
  }
}
```

**After**

```json
{
  "success": true,
  "session": {
    /* Mongo document including simulationState */
  },
  "currentRound": 3,
  "metrics": {
    /* UI metrics for current state */
  },
  "event": {
    /* current EventCard */
  },
  "narrative": {
    /* optional */
  },
  "scenarioId": "baseline",
  "ageYears": 22.17
}
```

**Breaking:** Clients must not replay `session.rounds` locally to rebuild state. Hydrate the UI from `metrics` + `event` (and `currentRound`).

**Legacy sessions:** Documents created before this migration without `simulationState` will not include `event` / `metrics`; start a new session from `/setup`.

---

### `GET /api/game/sessions`

Unchanged shape; `scenarioId` may appear on list items.

---

## `metrics` shape (API → UI)

Server returns display metrics (no raw `SimState` on the wire):

```json
{
  "monthlyIncome": 3200,
  "monthlyExpenses": 2100,
  "savingsBalance": 800,
  "totalDebt": 600,
  "creditScore": 680,
  "retirementBalance": 0,
  "debtToIncome": 18.5,
  "stressIndex": 24,
  "netWorth": 200,
  "inflationAnnual": 0.03,
  "recessionProbAnnual": 0.14,
  "investments": 0,
  "burnout": 15,
  "bufferMonths": 0.38,
  "outcomeScore": { "composite": 42 /* … */ }
}
```

**Persisted per round** (`session.rounds[].metricsAfter`) uses the debrief/storage shape (`savingsBalance`, `investmentBalance`, `stressIndex`, etc.) — computed server-side via `toStoredMetrics()`.

---

## Database schema (`GameSession`)

**Added**

- `scenarioId` (string)
- `simSeed` (number)
- `simulationState` (Mixed) — full engine state
- `currentEvent` (Mixed)
- `currentNarrative` (Mixed)

**Changed**

- `rounds[].choice`: enum `["left", "right"]` (was `["A", "B"]`)
- `rounds[].eventId` (optional string)

**Unchanged**

- `finalMetrics`, `debriefReport`, setup fields (`career`, `goal`, …)

---

## Frontend changes

| File                                             | Change                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `frontend/lib/sim/*`                             | **Removed** — logic moved to backend                               |
| `frontend/lib/game-types.ts`                     | **Added** — types only for UI                                      |
| `frontend/context/GameContext.jsx`               | No `createNewGame` / `applyChoice`; `hydrateGameView()` from API   |
| `frontend/app/game/page.jsx`                     | Round submit: `{ sessionId, choice }` only; load via GET hydration |
| `frontend/app/onboarding/page.jsx`               | Redirects to `/setup` (no local sim start)                         |
| `frontend/components/game/SwipeDecisionCard.tsx` | Imports types from `@/lib/game-types`                              |

**Client must not:**

- Import or run simulation math
- Send `metricsAfter`, `round`, or `title` on round submit
- Recompute net worth, tax, DTI, or investments for gameplay

---

## Backend layout

```
backend/src/services/simulation/
  engine.js      # createNewGame, applyChoice, nextEvent, getVisibleMetrics
  events.js      # generateEvent, rollMacro
  scenarios.js   # SCENARIOS, getScenario
  math.js        # tax, amortization, clamp, …
  prng.js        # Mulberry32 RNG
  metrics.js     # toUIMetrics, toStoredMetrics, deriveScenarioId, buildGameView
  index.js       # re-exports
```

---

## Debrief / AI compatibility

- `backend/src/ai/debrief.js` maps `left` → `A`, `right` → `B` when comparing to legacy `OPTIMAL_CHOICES` (static round map from the old canned game).
- Dynamic sim events may not align 1:1 with that map; debrief “optimal path” is approximate for migrated sessions.

---

## Upgrade checklist

1. Deploy backend with new `GameSession` fields and controllers.
2. Deploy frontend without `lib/sim`.
3. **Invalidate or complete** in-progress sessions that lack `simulationState` (users restart from `/setup`).
4. Update any external API clients to the new create/round/GET shapes.
5. Remove references to `metricsAfter` in client integration tests.

---

## Verification

```bash
cd backend && node -e "
const { createNewGame, applyChoice } = require('./src/services/simulation');
const s = createNewGame({ scenarioId: 'baseline', seed: 42 });
const r = applyChoice({ state: s.state, choice: 'left' });
console.log(r.event.id, r.metrics.netWorth);
"
```

Expected: logs an event id and a numeric net worth with no errors.
