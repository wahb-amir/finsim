/**
 * FinSim API Stub Layer
 * All functions log inputs and return hardcoded mock data.
 * Replace with real API calls when backend is ready.
 */

export const MOCK_ROUNDS = [
  {
    round: 1,
    year: "Age 22",
    title: "Your first paycheck arrives",
    description:
      "You just landed your first full-time job paying $48,000/year. After taxes, you take home $3,200/month. Your rent is $1,100. You have $800 in savings from college odd jobs. The first decision of your financial life is staring at you.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Build an emergency fund first",
        bullets: [
          "Save $500/month until you have 3 months of expenses",
          "Low financial stress in the short term",
          "Slower growth on other goals initially",
        ],
      },
      {
        id: "B",
        title: "Invest everything in the market",
        bullets: [
          "Maximize early compound growth potential",
          "Zero cushion if you lose income",
          "High psychological volatility risk",
        ],
      },
    ],
  },
  {
    round: 2,
    year: "Age 23",
    title: "A credit card offer arrives",
    description:
      "A bank is offering you a credit card with a $5,000 limit at 21.9% APR and a $150 sign-up bonus. Your coworker says 'everyone has one.' You've been paying for everything in cash. Your savings have grown steadily, but there's a weekend trip with friends you want to take.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Accept and pay in full monthly",
        bullets: [
          "Builds credit history (score +20 over 6 months)",
          "Earns cashback rewards",
          "Requires strict discipline every billing cycle",
        ],
      },
      {
        id: "B",
        title: "Decline — cash only for now",
        bullets: [
          "No debt risk whatsoever",
          "Credit score stays thin, harder to rent later",
          "Miss out on rewards and credit-building",
        ],
      },
    ],
  },
  {
    round: 3,
    year: "Age 24",
    title: "Car trouble hits hard",
    description:
      "Your 2008 Honda gives out. The mechanic says it needs $2,800 in repairs — nearly what it's worth. A dealership will give you $1,000 trade-in toward a new $22,000 car. Your coworker swears the car payment is 'only $380/month.'",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Pay for repairs, keep the old car",
        bullets: [
          "Saves $19,000 vs buying new",
          "Risk of another repair soon",
          "No new monthly debt payment",
        ],
      },
      {
        id: "B",
        title: "Finance the new car",
        bullets: [
          "$380/month for 60 months at 6.9% APR",
          "Total cost: $22,800 + $22,000 financed = real cost $24,700",
          "Reliable transportation, but debt-to-income rises",
        ],
      },
    ],
  },
  {
    round: 4,
    year: "Age 25",
    title: "⚠ CRISIS: Medical emergency",
    description:
      "You're hospitalized for two days with appendicitis. Your insurance covers 80%, but your deductible kicks in. The bill: $3,400 out of pocket due in 30 days. Your savings account has $4,200 in it. The hospital offers a payment plan at 0% interest.",
    isCrisis: true,
    choices: [
      {
        id: "A",
        title: "Pay in full immediately",
        bullets: [
          "Clears debt instantly, no future obligation",
          "Savings drop to $800 — dangerously low",
          "Forces disciplined rebuilding phase",
        ],
      },
      {
        id: "B",
        title: "Take the 0% payment plan",
        bullets: [
          "Keep savings intact, pay $283/month for 12 months",
          "No interest — this is legitimately smart",
          "Slight mental overhead tracking the payment",
        ],
      },
    ],
  },
  {
    round: 5,
    year: "Age 26",
    title: "Roommate wants out — apartment decision",
    description:
      "Your roommate is moving out. You can either find a new one or get your own 1-bedroom. The 1BR costs $400 more per month. Your friend says 'you deserve your own space.' Your financial advisor (hi, that's us) is watching quietly.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Get a new roommate",
        bullets: [
          "Save $4,800/year extra",
          "Less privacy but far more financial headroom",
          "Savings compound faster with the extra $400",
        ],
      },
      {
        id: "B",
        title: "Go solo — your own space",
        bullets: [
          "Quality of life boost (real value)",
          "Lifestyle inflation risk — hard to go back",
          "$400/month less for savings, investing, or debt",
        ],
      },
    ],
  },
  {
    round: 6,
    year: "Age 27",
    title: "Your employer adds a 401k match",
    description:
      "Your company now matches 4% of your salary in 401k contributions. You currently contribute 0% because you were 'dealing with other stuff.' HR sends an email saying you can change it anytime. This is free money waiting to be claimed.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Max the match — contribute 4%",
        bullets: [
          "Instant 100% return on $1,920/year",
          "$3,840/year going into retirement",
          "Take-home drops by $120/month after tax adjustment",
        ],
      },
      {
        id: "B",
        title: "Skip it — need the money now",
        bullets: [
          "Keep full take-home pay",
          "Leave $1,920/year in free money on the table",
          "30-year cost in missed compound growth: ~$300k",
        ],
      },
    ],
  },
  {
    round: 7,
    year: "Age 28",
    title: "A side project takes off",
    description:
      "Your weekend photography side hustle earned $6,000 last year. A client offers you $12,000 to shoot their product catalog — but it requires 6 weekends away. You'd need to report this income, and it could push you into a higher bracket.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Take the contract, grow the income",
        bullets: [
          "+$12,000 gross; ~$8,400 after SE tax",
          "Builds skills and portfolio for future income",
          "Time cost: 6 weekends + admin overhead",
        ],
      },
      {
        id: "B",
        title: "Keep weekends for rest and life",
        bullets: [
          "Protect work-life balance",
          "No burnout risk",
          "Opportunity cost: $8,400 and future contract pipeline",
        ],
      },
    ],
  },
  {
    round: 8,
    year: "Age 29",
    title: "⚠ CRISIS: Company layoffs",
    description:
      "You're laid off. You get 6 weeks severance. Your monthly expenses are $2,800. Your emergency fund has 3 months of expenses. Unemployment will cover $1,400/month. Your former colleague is offering you a startup job at $10k less but 0.5% equity.",
    isCrisis: true,
    choices: [
      {
        id: "A",
        title: "Take the startup job quickly",
        bullets: [
          "Income resumes, equity upside exists",
          "$10k/year less, but real optionality",
          "Stress of startup uncertainty ongoing",
        ],
      },
      {
        id: "B",
        title: "Job search carefully, use the fund",
        bullets: [
          "Find the right fit, no rushed decision",
          "4–5 months to find role at target salary",
          "Emergency fund depletes: calculated but stressful",
        ],
      },
    ],
  },
  {
    round: 9,
    year: "Age 30",
    title: "Ready to buy a home?",
    description:
      "You have $28,000 saved. A 2BR condo is listed at $285,000 — just within reach with a 10% down payment. Mortgage would be $1,640/month. Your current rent is $1,350. The market has risen 12% in 2 years. Your friends are all buying.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Buy — build equity now",
        bullets: [
          "Locks in today's rate (~6.8%)",
          "Payment is $290 more than rent, but builds equity",
          "Ties up savings, less liquid for 5+ years",
        ],
      },
      {
        id: "B",
        title: "Keep renting, save more",
        bullets: [
          "Wait for 20% down to avoid PMI ($142/month)",
          "Flexibility to move for better opportunities",
          "Risk: prices may rise further",
        ],
      },
    ],
  },
  {
    round: 10,
    year: "Age 31",
    title: "The final move — invest the windfall",
    description:
      "Your grandparent left you $15,000. Your financial picture is finally coming into focus. This is a one-time inflection point. What you do with this shapes the next decade.",
    isCrisis: false,
    choices: [
      {
        id: "A",
        title: "Index funds — set and forget",
        bullets: [
          "Broad diversification, low fees",
          "Historical ~7% real return annually",
          "Patient, long-term compounding strategy",
        ],
      },
      {
        id: "B",
        title: "Pay down highest-interest debt",
        bullets: [
          "Guaranteed 'return' equal to interest rate",
          "Reduces stress index significantly",
          "Less wealth upside but more security",
        ],
      },
    ],
  },
];

export const MOCK_ADVISOR_MESSAGES = [
  "Before you decide — what would happen to your lifestyle if your income disappeared tomorrow for 3 months?",
  "Think about this: if you carry a balance on that card at 21.9%, how much extra would you pay on a $1,000 purchase over a year?",
  "What's the actual cost per mile of financing a new car versus keeping the one you have?",
  "In a crisis, what matters more — having cash available, or having zero debt? Can both be true at once?",
  "If $400/month extra in rent compounded at 7% for 30 years — what would that be worth at retirement?",
  "Describe the difference between 'spending money you have' and 'leaving free money on the table.' Which is happening here?",
  "When you earn more, do your expenses naturally rise too? What would it take to break that pattern?",
  "If you used your emergency fund to survive a layoff, and then found a better job — was that fund an 'expense' or an 'investment'?",
  "What's the true cost of buying vs. renting when you factor in maintenance, taxes, and opportunity cost on the down payment?",
  "Looking back on all 10 rounds — which single decision had the highest leverage on your final net worth? Why?",
];

export const MOCK_DEBRIEF = {
  verdict: "You made some sharp moves. A few emotional calls cost you — but you're building.",
  optimalPath: [
    { round: 1, choice: "Build emergency fund", optimal: "Build emergency fund", match: true },
    { round: 2, choice: "Accept card, pay full", optimal: "Accept card, pay full", match: true },
    { round: 3, choice: "Finance new car", optimal: "Repair old car", match: false },
    { round: 4, choice: "Payment plan (0%)", optimal: "Payment plan (0%)", match: true },
    { round: 5, choice: "Go solo apartment", optimal: "Get new roommate", match: false },
    { round: 6, choice: "Max the match", optimal: "Max the match", match: true },
    { round: 7, choice: "Take contract", optimal: "Take contract", match: true },
    { round: 8, choice: "Take startup job", optimal: "Job search carefully", match: false },
    { round: 9, choice: "Keep renting", optimal: "Keep renting", match: true },
    { round: 10, choice: "Index funds", optimal: "Index funds", match: true },
  ],
  netWorthProgression: [
    { round: 1, player: 800, optimal: 800 },
    { round: 2, player: 3200, optimal: 4100 },
    { round: 3, player: 1800, optimal: 7200 },
    { round: 4, player: 4200, optimal: 9800 },
    { round: 5, player: 2100, optimal: 15200 },
    { round: 6, player: 6800, optimal: 21400 },
    { round: 7, player: 14200, optimal: 29800 },
    { round: 8, player: 11600, optimal: 34100 },
    { round: 9, player: 18900, optimal: 42800 },
    { round: 10, player: 34700, optimal: 58200 },
  ],
};

export const MOCK_LEADERBOARD = [
  { rank: 1, name: "Priya S.", netWorth: 72400, creditScore: 798, score: 9420 },
  { rank: 2, name: "Marcus T.", netWorth: 68100, creditScore: 781, score: 8980 },
  { rank: 3, name: "Zoe K.", netWorth: 61300, creditScore: 776, score: 8540 },
  { rank: 4, name: "Aiden R.", netWorth: 58200, creditScore: 760, score: 8210 },
  { rank: 5, name: "Leila M.", netWorth: 52700, creditScore: 744, score: 7890 },
  { rank: 6, name: "Carlos F.", netWorth: 48900, creditScore: 731, score: 7540 },
  { rank: 7, name: "Nina B.", netWorth: 43100, creditScore: 718, score: 7120 },
  { rank: 8, name: "Dev P.", netWorth: 39400, creditScore: 702, score: 6780 },
  { rank: 9, name: "Tomas W.", netWorth: 34700, creditScore: 689, score: 6340 },
  { rank: 10, name: "Jordan L.", netWorth: 28300, creditScore: 671, score: 5890 },
];

/**
 * Submit a choice for a round — returns updated metrics
 * TODO: Replace with real calculation logic
 */
export async function submitChoice(round, choiceId, currentMetrics) {
  console.log("[submitChoice]", { round, choiceId, currentMetrics });

  // TODO: Implement real metric delta calculations per round/choice
  await new Promise((r) => setTimeout(r, 600));

  const isGoodChoice = choiceId === "A";
  const deltaIncome = round === 7 ? (isGoodChoice ? 700 : 0) : 0;
  const deltaDebt = choiceId === "B" && round === 3 ? 21000 : 0;
  const deltaSavings = isGoodChoice ? Math.floor(Math.random() * 800 + 200) : -Math.floor(Math.random() * 400 + 100);
  const deltaCreditScore = isGoodChoice ? Math.floor(Math.random() * 15) : -Math.floor(Math.random() * 10);
  const deltaStress = isGoodChoice ? -Math.floor(Math.random() * 8) : Math.floor(Math.random() * 12);
  const deltaRetirement = round >= 6 && isGoodChoice ? 1200 : 0;

  return {
    monthlyIncome: currentMetrics.monthlyIncome + deltaIncome,
    monthlyExpenses: currentMetrics.monthlyExpenses + (deltaDebt > 0 ? 380 : 0),
    savingsBalance: Math.max(0, currentMetrics.savingsBalance + deltaSavings),
    totalDebt: currentMetrics.totalDebt + deltaDebt,
    creditScore: Math.min(850, Math.max(300, currentMetrics.creditScore + deltaCreditScore)),
    retirementBalance: currentMetrics.retirementBalance + deltaRetirement,
    debtToIncome: Math.max(0, Math.min(100, currentMetrics.debtToIncome + (isGoodChoice ? -2 : 4))),
    stressIndex: Math.max(0, Math.min(100, currentMetrics.stressIndex + deltaStress)),
  };
}

/**
 * Get advisor's Socratic question for current round
 * TODO: Replace with real AI call (WebSocket or SSE)
 */
export async function getAdvisorMessage(round, metrics, flags) {
  console.log("[getAdvisorMessage]", { round, metrics, flags });
  await new Promise((r) => setTimeout(r, 800));
  return MOCK_ADVISOR_MESSAGES[(round - 1) % MOCK_ADVISOR_MESSAGES.length];
}

/**
 * Get final debrief summary
 * TODO: Replace with real AI-generated analysis
 */
export async function getFinalDebrief(roundHistory, finalMetrics) {
  console.log("[getFinalDebrief]", { roundHistory, finalMetrics });
  await new Promise((r) => setTimeout(r, 1200));
  return MOCK_DEBRIEF;
}
