# FinSim — Live 10 Years in 15 Minutes
 
> A personal finance life simulator that puts you through 10 years of real financial decisions — rent, credit cards, layoffs, investments — and shows you exactly where each choice leads.
 
---
 
## The Problem
 
80% of teens enter adulthood without understanding credit scores, compound interest, or how a single financial decision compounds over decades. By the time the consequences arrive, it's too late to replay the moment.
 
FinSim makes those moments replayable — before they're real.
 
---
 
## What It Is
 
A 10-round simulation where each round presents a true-to-life financial scenario: a credit card offer at 21.9% APR, a surprise medical bill, a layoff, a first home purchase. You pick a path. Your metrics update. An AI advisor asks you Socratic questions instead of giving you answers.
 
At the end, you see your net worth trajectory versus the optimal path — and understand exactly where the gap opened.
 
---
 
## Demo
 
| Landing | Setup | Game Board |
|---|---|---|
| Hero + stat cards | 3-step player config | Metrics · Scenario · Advisor |
 
**Play through:** `/` → `/setup` → `/game` → `/debrief` → `/leaderboard`
 
---
 
## Stack
 
- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript (no TypeScript)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **State:** React Context + `useReducer`
- **Fonts:** Syne (display) · DM Sans (body)
- **Backend:** Stubbed — drop in your own API
---
 
## Project Structure
 
```
finsim/
├── app/
│   ├── page.jsx              # Landing — hero + problem stats
│   ├── setup/page.jsx        # Player setup — name, confidence, goal
│   ├── game/page.jsx         # Main game board (priority page)
│   ├── debrief/page.jsx      # Final result + decision breakdown
│   ├── leaderboard/page.jsx  # Top 10 scores
│   ├── layout.jsx
│   └── globals.css           # Design tokens + animations
├── components/
│   └── ui/
│       ├── MetricCard.jsx    # Live metric display (compact + full)
│       ├── ChoiceCard.jsx    # Selectable decision card
│       ├── AdvisorPanel.jsx  # AI advisor + typewriter effect
│       ├── RoundProgress.jsx # 10-dot bottom progress bar
│       ├── NetWorthChart.jsx # Recharts player vs optimal
│       └── StatCard.jsx      # Landing + debrief stat display
├── context/
│   └── GameContext.jsx       # Global game state (useReducer)
└── lib/
    └── api.js                # Stubbed API layer + mock data
```
 
---
 
## Game Board Layout
 
```
┌─────────────┬──────────────────────────────┬────────────────┐
│  Sidebar    │       Center Panel           │  Right Panel   │
│  ~260px     │       flex-1                 │  ~320px        │
│             │                              │                │
│  Player     │  Round header + year         │  FinSim        │
│  Year X/10  │  Scenario description        │  Advisor       │
│             │                              │                │
│  8 metrics: │  ┌────────┐  ┌────────┐     │  Typewriter    │
│  Income     │  │Choice A│  │Choice B│     │  Socratic Q    │
│  Expenses   │  └────────┘  └────────┘     │                │
│  Savings    │                              │  Follow-up     │
│  Debt       │  [Confirm Decision]          │  input         │
│  Credit     │                              │                │
│  Retirement │                              │                │
│  DTI        │                              │                │
│  Stress     │                              │                │
└─────────────┴──────────────────────────────┴────────────────┘
         ●●●●●◉●●●●   Round progress bar (fixed bottom)
```
 
Crisis rounds (4, 8) shift the center panel to a dark red tint with a `⚠ CRISIS` badge.
 
---
 
## Metrics Tracked
 
| Metric | Color Logic |
|---|---|
| Monthly Income | Neutral |
| Monthly Expenses | Neutral |
| Savings Balance | Green >$5k · Amber >$1k · Red below |
| Total Debt | Green $0 · Amber <$10k · Red above |
| Credit Score | Green ≥700 · Amber 600–699 · Red <600 |
| Retirement Balance | Green >$5k |
| Debt-to-Income Ratio | Green <20% · Amber <40% · Red above |
| Stress Index | Progress bar: green / amber / red |
 
---
 
## Getting Started
 
```bash
git clone https://github.com/your-username/finsim
cd finsim
npm install
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000).
 
---
 
## Connecting a Backend
 
All API calls are stubbed in `lib/api.js`. Three functions to implement:
 
```js
// Submit a player's choice and return updated metrics
submitChoice(round, choiceId, currentMetrics) → updatedMetrics
 
// Return an AI-generated Socratic question for the current state
getAdvisorMessage(round, metrics, flags) → string
 
// Return the final debrief summary after round 10
getFinalDebrief(roundHistory, finalMetrics) → debriefObject
```
 
The advisor panel is wired for streaming — replace the mock typewriter with a real WebSocket or SSE stream from your LLM endpoint.
 
---
 
## Design System
 
```
Base:       #0A0A0A
Surface:    #111111
Border:     #1F1F1F – #242424
Accent:     #F59E0B  (amber — primary actions, active states only)
Success:    #10B981  (green)
Danger:     #EF4444  (red)
Text:       #F5F5F5 / #A1A1A1 / #6B6B6B
```
 
Fonts: **Syne** (headings) + **DM Sans** (body)
 
---
 
## Roadmap
 
- [ ] Real metric calculation engine per round/choice
- [ ] Live AI advisor via WebSocket (GPT-4 / Claude)
- [ ] User auth + persistent leaderboard (Supabase)
- [ ] Mobile-optimized game layout
- [ ] Shareable result card (OG image generation)
- [ ] Scenario randomization and difficulty tiers
- [ ] Educator mode — classroom deployment
---
