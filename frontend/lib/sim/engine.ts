import {
  clamp,
  paymentAmortized,
  round2,
  stepAmortization,
  taxAnnual,
  type TaxBracket,
} from "./math";
import type { EventCard, MacroSnapshot, ChoiceId, DelayedEffect } from "./events";
import { generateEvent, rollMacro } from "./events";
import { createRng, hashSeed } from "./prng";
import { getScenario, type ScenarioId } from "./scenarios";

export type TimeStep = "month";

export type DebtKind = "credit-card" | "student" | "car" | "medical";

export type Debt = {
  id: string;
  kind: DebtKind;
  balance: number;
  apr: number;
  minPaymentMonthly: number;
  termMonths?: number;
};

export type Portfolio = {
  taxable: number;
  retirement: number;
  equity: number; // founder equity fraction (0..1)
};

// ─── Pending delayed effects (fix #5) ─────────────────────────────────────────
export type PendingEffect = DelayedEffect & {
  triggerMonth: number; // absolute month index when it fires
  sourceEventId: string;
  choiceId: ChoiceId;
};

// ─── Composite outcome scoring (fix #7) ───────────────────────────────────────
export type OutcomeScore = {
  netWorthScore: number;       // 0..100 — net worth vs scenario-adjusted benchmark
  resilienceScore: number;     // 0..100 — based on months of buffer
  debtHealthScore: number;     // 0..100 — inverse of DTI
  creditHealthScore: number;   // 0..100 — credit score normalized
  stabilityScore: number;      // 0..100 — inverse of stress
  trajectoryScore: number;     // 0..100 — income growth rate
  composite: number;           // 0..100 — weighted composite
};

export type SimState = {
  seed: number;
  scenarioId: ScenarioId;
  step: TimeStep;
  monthIndex: number;
  ageYears: number;
  cash: number;
  grossIncomeAnnual: number;
  baseExpensesMonthly: number;
  creditScore: number;
  burnout: number;       // 0..100
  stress: number;        // 0..100
  debts: Debt[];
  portfolio: Portfolio;
  macro: MacroSnapshot;
  lastEvent?: EventCard;
  lastChoice?: ChoiceId;
  pendingEffects: PendingEffect[];   // delayed consequences queue
  history: Array<{
    monthIndex: number;
    cash: number;
    netWorth: number;
    creditScore: number;
    stress: number;
    inflationAnnual: number;
    recessionProbAnnual: number;
    grossIncomeAnnual: number;
  }>;
};

export type VisibleMetrics = {
  netWorth: number;
  cash: number;
  stress: number;
  burnout: number;
  creditScore: number;
  dti: number;
  monthlyIncomeNet: number;
  monthlyExpenses: number;
  totalDebt: number;
  investments: number;
  inflationAnnual: number;
  recessionProbAnnual: number;
  bufferMonths: number;
  outcomeScore: OutcomeScore;
};

// ─── Educational narrative (fix #4) ───────────────────────────────────────────
export type RoundDebrief = {
  principle: string;
  whyItHappened: string;
  counterfactual: string;
  ruleOfThumb: string;
  advisorQuestion: string; // Socratic follow-up (fix #4 "good advisor")
  firedEffects: string[];  // any delayed effects that fired this month
};

export type StepResult = {
  state: SimState;
  event: EventCard;
  metrics: VisibleMetrics;
  narrative: {
    headline: string;
    advisorHint: string;
  };
  debrief?: RoundDebrief; // populated after a choice is made
};

const DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX: readonly TaxBracket[] = [
  { upTo: 11950, rate: 0.1 },
  { upTo: 48500, rate: 0.12 },
  { upTo: 103500, rate: 0.22 },
  { upTo: 197000, rate: 0.24 },
  { upTo: 250000, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
] as const;

function sumDebt(debts: readonly Debt[]): number {
  return debts.reduce((s, d) => s + d.balance, 0);
}

function sumDebtPayments(debts: readonly Debt[]): number {
  return debts.reduce((s, d) => s + d.minPaymentMonthly, 0);
}

function computeNetWorth(state: SimState): number {
  const investments = state.portfolio.taxable + state.portfolio.retirement;
  return state.cash + investments - sumDebt(state.debts);
}

function computeDTI(state: SimState): number {
  const grossMonthly = state.grossIncomeAnnual / 12;
  if (grossMonthly <= 1e-6) return sumDebtPayments(state.debts) > 0 ? 1 : 0;
  return clamp(sumDebtPayments(state.debts) / grossMonthly, 0, 2);
}

function computeNetMonthlyIncome({
  grossIncomeAnnual,
  annualTax,
}: {
  grossIncomeAnnual: number;
  annualTax: number;
}): number {
  return (grossIncomeAnnual - annualTax) / 12;
}

function stressFromBuffer({ cash, expenses }: { cash: number; expenses: number }): number {
  const months = expenses > 0 ? cash / expenses : 6;
  const normalized = clamp((6 - months) / 6, 0, 1);
  return normalized * normalized * 65;
}

function stressFromDTI(dti: number): number {
  const x = clamp((dti - 0.15) / 0.55, 0, 1);
  return x * 30;
}

function bumpCreditScore({
  creditScore, onTime, utilization, newCreditLine, restrictedCredit,
}: {
  creditScore: number;
  onTime: boolean;
  utilization: number;
  newCreditLine: boolean;
  restrictedCredit: boolean;
}): number {
  let score = creditScore;
  if (onTime) score += 2;
  else score -= 18;
  if (utilization < 0.1) score += 2;
  else if (utilization < 0.3) score -= 1;
  else score -= 6;
  if (newCreditLine) score += restrictedCredit ? 3 : 6;
  return clamp(Math.round(score), 300, 850);
}

// ─── Composite outcome scoring (fix #7) ───────────────────────────────────────
function computeOutcomeScore(state: SimState): OutcomeScore {
  const netWorth = computeNetWorth(state);
  const dti = computeDTI(state);
  const bufferMonths = state.baseExpensesMonthly > 0
    ? state.cash / state.baseExpensesMonthly
    : 0;

  // Income growth vs starting income
  const scenario = getScenario(state.scenarioId);
  const startingIncome = scenario.start.grossSalaryAnnual || 1;
  const incomeGrowth = (state.grossIncomeAnnual - startingIncome) / Math.max(startingIncome, 1);

  // Benchmark net worth (loose: 10% annual savings on net income for months elapsed)
  const monthsElapsed = Math.max(1, state.monthIndex);
  const annualTax = taxAnnual({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const netMonthly = computeNetMonthlyIncome({ grossIncomeAnnual: state.grossIncomeAnnual, annualTax });
  const benchmarkNetWorth = netMonthly * monthsElapsed * 0.1;

  const netWorthScore = clamp(
    benchmarkNetWorth > 0 ? (netWorth / benchmarkNetWorth) * 50 : 50,
    0,
    100,
  );
  const resilienceScore = clamp((bufferMonths / 6) * 100, 0, 100);
  const debtHealthScore = clamp((1 - dti / 0.5) * 100, 0, 100);
  const creditHealthScore = clamp(((state.creditScore - 300) / 550) * 100, 0, 100);
  const stabilityScore = clamp((1 - state.stress / 100) * 100, 0, 100);
  const trajectoryScore = clamp((incomeGrowth / 0.3) * 100, 0, 100); // 30% growth = 100

  const composite = round2(
    netWorthScore * 0.2 +
    resilienceScore * 0.2 +
    debtHealthScore * 0.15 +
    creditHealthScore * 0.15 +
    stabilityScore * 0.15 +
    trajectoryScore * 0.15,
  );

  return {
    netWorthScore: round2(netWorthScore),
    resilienceScore: round2(resilienceScore),
    debtHealthScore: round2(debtHealthScore),
    creditHealthScore: round2(creditHealthScore),
    stabilityScore: round2(stabilityScore),
    trajectoryScore: round2(trajectoryScore),
    composite,
  };
}

// ─── Socratic advisor (fix #4) ────────────────────────────────────────────────
function socraticAdvisorQuestion(state: SimState, event: EventCard): string {
  const dti = computeDTI(state);
  const bufferMonths = state.baseExpensesMonthly > 0 ? state.cash / state.baseExpensesMonthly : 6;

  if (event.crisis && state.cash < state.baseExpensesMonthly * 1.5) {
    return "You chose short-term relief. What happens if a second shock lands in the next 60 days?";
  }
  if (dti > 0.4) {
    return "Your DTI is high enough to block new credit. What would you have to give up to pay down one debt completely?";
  }
  if (state.portfolio.taxable + state.portfolio.retirement < 500 && state.monthIndex > 6) {
    return "Six months in with no investments started. What single monthly expense could you automate into an index fund instead?";
  }
  if (bufferMonths < 1) {
    return "Your cash buffer is under one month. If you lost income today, what would you cut first?";
  }
  if (state.burnout > 70) {
    return "Burnout is high. Are the decisions you are making right now ones you would make at 50% of this stress level?";
  }
  return "Ask: does this choice reduce fragility, or increase optionality? The best move is usually one of those two things.";
}

function advisorForState(state: SimState, event: EventCard): string {
  const dti = computeDTI(state);
  if (event.crisis && state.cash < state.baseExpensesMonthly * 1.2) {
    return "In a crisis, cash runway is oxygen. Protect your next 90 days first.";
  }
  if (dti > 0.4)
    return "High DTI is a gatekeeper. Attack APR and monthly obligations before chasing upside.";
  if (state.portfolio.taxable + state.portfolio.retirement < 500 && state.monthIndex > 6) {
    return "Consistency beats intensity. Automate a small investment you can maintain through stress.";
  }
  return "Ask: does this choice reduce fragility, or increase optionality?";
}

// ─── Apply pending delayed effects that are now due (fix #5) ──────────────────
function fireDelayedEffects({
  state,
  nextDebts,
  cash,
  creditScore,
  stress,
  grossIncomeAnnual,
  baseExpensesMonthly,
}: {
  state: SimState;
  nextDebts: Debt[];
  cash: number;
  creditScore: number;
  stress: number;
  grossIncomeAnnual: number;
  baseExpensesMonthly: number;
}): {
  cash: number;
  creditScore: number;
  stress: number;
  grossIncomeAnnual: number;
  baseExpensesMonthly: number;
  debts: Debt[];
  firedLabels: string[];
} {
  const due = state.pendingEffects.filter(e => e.triggerMonth <= state.monthIndex);
  const firedLabels: string[] = [];
  let c = cash, cs = creditScore, st = stress, gi = grossIncomeAnnual, be = baseExpensesMonthly;
  const debts = [...nextDebts];

  for (const eff of due) {
    firedLabels.push(eff.label);
    if (eff.cashDelta) c = Math.max(0, c + eff.cashDelta);
    if (eff.stressDelta) st = clamp(st + eff.stressDelta, 0, 100);
    if (eff.creditDelta) cs = clamp(cs + eff.creditDelta, 300, 850);
    if (eff.expenseMultiplier) be = round2(be * eff.expenseMultiplier);
    if (eff.incomeMultiplier != null) gi = round2(gi * eff.incomeMultiplier);
    if (eff.debtAdd) {
      debts.push({
        id: `delayed:${state.monthIndex}:${eff.sourceEventId}`,
        kind: eff.debtAdd.kind,
        balance: eff.debtAdd.balance,
        apr: eff.debtAdd.apr,
        minPaymentMonthly: eff.debtAdd.kind === "medical"
          ? 50
          : round2(Math.max(35, eff.debtAdd.balance * 0.03)),
      });
    }
  }

  return { cash: c, creditScore: cs, stress: st, grossIncomeAnnual: gi, baseExpensesMonthly: be, debts, firedLabels };
}

// ─── createNewGame ─────────────────────────────────────────────────────────────
export function createNewGame({
  scenarioId,
  seed,
}: {
  scenarioId: ScenarioId;
  seed?: number;
}): StepResult {
  const scenario = getScenario(scenarioId);
  const actualSeed = (seed ?? hashSeed(`${scenarioId}:seedless`)) >>> 0;
  const rng = createRng(actualSeed);
  const macro = rollMacro({
    rng,
    baseInflationAnnual: scenario.modifiers.inflationAnnual,
    baseRecessionProbAnnual: scenario.modifiers.recessionProbAnnual,
    stressIndex: 25,
  });

  const debts: Debt[] = [];
  if (scenario.start.debt.kind !== "none" && scenario.start.debt.balance > 0) {
    const kindMap = scenario.start.debt.kind === "student" ? "student" : "credit-card";
    const term = scenario.start.debt.termMonths;
    const min = kindMap === "student" && term
      ? paymentAmortized({ principal: scenario.start.debt.balance, annualRate: scenario.start.debt.apr, termMonths: term })
      : Math.max(35, scenario.start.debt.balance * 0.03);
    debts.push({
      id: `d0`,
      kind: kindMap as DebtKind,
      balance: scenario.start.debt.balance,
      apr: scenario.start.debt.apr,
      minPaymentMonthly: round2(min),
      termMonths: term,
    });
  }

  const state: SimState = {
    seed: actualSeed,
    scenarioId,
    step: "month",
    monthIndex: 0,
    ageYears: scenario.start.ageYears,
    cash: scenario.start.cash,
    grossIncomeAnnual: scenario.start.grossSalaryAnnual,
    baseExpensesMonthly:
      scenario.start.baseExpensesMonthly +
      scenario.modifiers.childcareMonthly +
      scenario.modifiers.remittanceMonthly,
    creditScore: scenario.start.creditScore,
    burnout: clamp(15 + scenario.modifiers.burnoutDriftMonthly * 2, 0, 100),
    stress: 20,
    debts,
    portfolio: { ...scenario.start.investments },
    macro,
    pendingEffects: [],
    history: [],
  };

  return nextEvent({ state });
}

// ─── nextEvent: generate the next card to present ────────────────────────────
export function nextEvent({ state }: { state: SimState }): StepResult {
  const rng = createRng((state.seed + state.monthIndex * 2654435761) >>> 0);
  const scenario = getScenario(state.scenarioId);
  const dti = computeDTI(state);

  const event = generateEvent({
    rng,
    monthIndex: state.monthIndex,
    cash: state.cash,
    creditScore: state.creditScore,
    dti,
    stress: state.stress,
    burnout: state.burnout,
    ageYears: state.ageYears,
    grossIncomeAnnual: state.grossIncomeAnnual,
    pendingDelayedEffects: state.pendingEffects,
    scenarioFlags: {
      restrictedCredit: scenario.modifiers.restrictedCredit,
      remittanceMonthly: scenario.modifiers.remittanceMonthly,
      childcareMonthly: scenario.modifiers.childcareMonthly,
      healthcareRiskAnnual: scenario.modifiers.healthcareRiskAnnual,  // fix #2
      layoffProbAnnual: scenario.modifiers.layoffProbAnnual,           // fix #2
      burnoutDriftMonthly: scenario.modifiers.burnoutDriftMonthly,
      hasEquity: scenario.start.investments.equity > 0,               // fix #2
    },
    macro: state.macro,
  });

  const metrics = getVisibleMetrics(state);
  return {
    state: { ...state, lastEvent: event },
    event,
    metrics,
    narrative: {
      headline: event.crisis ? "Pressure spikes." : "A lever appears.",
      advisorHint: advisorForState(state, event),
    },
  };
}

// ─── applyChoice: pure state transition ───────────────────────────────────────
export function applyChoice({
  state,
  choice,
}: {
  state: SimState;
  choice: ChoiceId;
}): StepResult {
  const scenario = getScenario(state.scenarioId);
  const rng = createRng((state.seed ^ ((state.monthIndex + 1) * 2246822519)) >>> 0);

  const annualTax = taxAnnual({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const netIncomeMonthly = computeNetMonthlyIncome({
    grossIncomeAnnual: state.grossIncomeAnnual,
    annualTax,
  });

  const nextMacro = rollMacro({
    rng,
    baseInflationAnnual: scenario.modifiers.inflationAnnual,
    baseRecessionProbAnnual: scenario.modifiers.recessionProbAnnual,
    stressIndex: state.stress,
  });

  const inflationMonthly = Math.pow(1 + nextMacro.inflationAnnual, 1 / 12) - 1;
  let expenses = state.baseExpensesMonthly * (1 + inflationMonthly);

  let investMonthly = 0;
  let extraDebtPayment = 0;
  let newCreditLine = false;
  let utilizationTarget = 0.08;

  const last = state.lastEvent;
  if (last?.tag === "budget") {
    if (choice === "left") {
      expenses *= 0.995;
    } else {
      expenses *= 1.03;
      utilizationTarget = 0.25;
    }
  }

  if (last?.tag === "credit") {
    if (choice === "left") {
      newCreditLine = true;
      utilizationTarget = 0.06;
    } else {
      utilizationTarget = 0.0;
    }
  }

  if (last?.tag === "investing") {
    if (choice === "left") {
      investMonthly = Math.max(0, (netIncomeMonthly - expenses) * 0.35);
    }
  }

  if (last?.tag === "retirement") {
    if (choice === "left") {
      // Pre-tax retirement contribution (reduces take-home)
      investMonthly = Math.max(0, (netIncomeMonthly - expenses) * 0.06);
      expenses -= round2(investMonthly * 0.22); // approximate tax savings
    }
  }

  if (last?.tag === "behavioral" && choice === "right") {
    expenses *= 1.04; // lifestyle lock-in
  }

  if (last?.tag === "tax" && choice === "left") {
    // HSA/Roth equivalent — add cash bump
    expenses -= 18; // ~$220/year in tax savings split across 12 months
  }

  if (last?.id?.startsWith("dti:")) {
    if (choice === "left") {
      extraDebtPayment = Math.max(0, (netIncomeMonthly - expenses) * 0.5);
    }
  }

  if (last?.tag === "career" && choice === "left") {
    // Job switch: income bump is handled as a delayed effect; short-term disruption
    expenses *= 1.01; // relocation / onboarding costs
  }

  if (last?.tag === "insurance" && choice === "left") {
    expenses += 18; // ~$18/month renter's insurance
  }

  // ─── Queue delayed effects from this choice (fix #5) ────────────────────────
  const choiceEffects = choice === "left" ? last?.leftEffects : last?.rightEffects;
  const newPendingEffects: PendingEffect[] = [
    ...state.pendingEffects,
    ...(choiceEffects ?? []).map(eff => ({
      ...eff,
      triggerMonth: state.monthIndex + eff.triggerMonthOffset,
      sourceEventId: last?.id ?? "unknown",
      choiceId: choice,
    })),
  ];

  // ─── Cash flow ───────────────────────────────────────────────────────────────
  let cash = state.cash + netIncomeMonthly;
  cash -= expenses;

  const restrictedCredit = scenario.modifiers.restrictedCredit;
  if (cash < 0) {
    const spill = -cash;
    cash = 0;
    const existingCC = state.debts.find(d => d.kind === "credit-card");
    if (existingCC && !restrictedCredit) {
      existingCC.balance += spill;
      existingCC.apr = Math.max(existingCC.apr, 0.219);
      existingCC.minPaymentMonthly = round2(Math.max(35, existingCC.balance * 0.03));
    } else {
      state.debts.push({
        id: `spill:${state.monthIndex}`,
        kind: restrictedCredit ? "medical" : "credit-card",
        balance: spill,
        apr: restrictedCredit ? 0.0 : 0.249,
        minPaymentMonthly: restrictedCredit ? 50 : round2(Math.max(35, spill * 0.03)),
      });
    }
  }

  // ─── Debt payments ───────────────────────────────────────────────────────────
  let onTime = true;
  const nextDebts: Debt[] = state.debts
    .map(d => ({ ...d }))
    .map(d => {
      if (d.balance <= 0) return d;
      const pay = Math.min(d.minPaymentMonthly, cash);
      if (pay + 1e-6 < d.minPaymentMonthly) onTime = false;
      cash -= pay;
      const stepped = stepAmortization({ balance: d.balance, annualRate: d.apr, payment: pay });
      return {
        ...d,
        balance: stepped.nextBalance,
        minPaymentMonthly: d.termMonths && d.kind !== "credit-card"
          ? round2(paymentAmortized({ principal: stepped.nextBalance, annualRate: d.apr, termMonths: Math.max(1, d.termMonths - 1) }))
          : round2(Math.max(35, stepped.nextBalance * 0.03)),
        termMonths: d.termMonths ? Math.max(0, d.termMonths - 1) : undefined,
      };
    })
    .filter(d => d.balance > 0.01);

  // Extra debt payoff to highest APR
  if (extraDebtPayment > 0 && cash > 0 && nextDebts.length > 0) {
    let extra = Math.min(extraDebtPayment, cash);
    cash -= extra;
    const sorted = [...nextDebts].sort((a, b) => b.apr - a.apr);
    for (const d of sorted) {
      if (extra <= 0) break;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }

  // ─── Investing ───────────────────────────────────────────────────────────────
  const marketMonthly = Math.pow(1 + nextMacro.marketReturnAnnual, 1 / 12) - 1;
  const invest = Math.min(investMonthly, Math.max(0, cash));
  cash -= invest;

  const taxable = (state.portfolio.taxable + invest) * (1 + marketMonthly);
  const retirement = state.portfolio.retirement * (1 + marketMonthly);

  // ─── Credit score ─────────────────────────────────────────────────────────────
  const revolving = nextDebts.filter(d => d.kind === "credit-card").reduce((s, d) => s + d.balance, 0);
  const pseudoLimit = restrictedCredit ? 1500 : 6000;
  const utilization = pseudoLimit > 0 ? revolving / pseudoLimit : 0;
  let creditScore = bumpCreditScore({
    creditScore: state.creditScore,
    onTime,
    utilization: Math.max(utilizationTarget, utilization),
    newCreditLine,
    restrictedCredit,
  });

  // ─── Apply due delayed effects (fix #5) ──────────────────────────────────────
  const nextMonthIndex = state.monthIndex + 1;
  const effResult = fireDelayedEffects({
    state: { ...state, monthIndex: nextMonthIndex, pendingEffects: newPendingEffects },
    nextDebts,
    cash,
    creditScore,
    stress: state.stress,
    grossIncomeAnnual: state.grossIncomeAnnual,
    baseExpensesMonthly: expenses,
  });
  cash = effResult.cash;
  creditScore = effResult.creditScore;
  let grossIncomeAnnual = effResult.grossIncomeAnnual;
  expenses = effResult.baseExpensesMonthly;

  // Remove effects that already fired (triggerMonth < nextMonthIndex)
  const remainingPendingEffects = newPendingEffects.filter(
    e => e.triggerMonth >= nextMonthIndex,
  );

  // ─── DTI & stress ─────────────────────────────────────────────────────────────
  const dtiNext = (() => {
    const grossMonthly = grossIncomeAnnual / 12;
    const debtPay = sumDebtPayments(effResult.debts);
    return grossMonthly <= 1e-6 ? (debtPay > 0 ? 1 : 0) : clamp(debtPay / grossMonthly, 0, 2);
  })();

  const bufferStress = stressFromBuffer({ cash, expenses });
  const dtiStress = stressFromDTI(dtiNext);
  const macroStress = clamp(nextMacro.recessionProbAnnual * 35 + nextMacro.inflationAnnual * 120, 0, 35);
  const burnout = clamp(
    state.burnout + scenario.modifiers.burnoutDriftMonthly + (choice === "right" ? 0.3 : -0.1),
    0,
    100,
  );
  // Stress computed fresh from components each month (prevents monotonic accumulation).
  // Delayed effects that fired this month may have already shifted effResult.stress up/down.
  const stressBase = 5 + bufferStress + dtiStress + macroStress + burnout * 0.15;
  const stress = clamp(round2(effResult.stress * 0.25 + stressBase * 0.75), 0, 100);

  // ─── Wage growth + layoff ──────────────────────────────────────────────────────
  const wageMonthly = Math.pow(1 + scenario.modifiers.wageGrowthAnnual, 1 / 12) - 1;
  grossIncomeAnnual = grossIncomeAnnual * (1 + wageMonthly);
  if (
    nextMacro.recessionProbAnnual > 0.25 &&
    rng.next() < scenario.modifiers.layoffProbAnnual / 12
  ) {
    grossIncomeAnnual = Math.max(0, grossIncomeAnnual * 0.5);
  }

  // ─── Build next state ─────────────────────────────────────────────────────────
  const nextState: SimState = {
    ...state,
    monthIndex: state.monthIndex + 1,
    ageYears: state.ageYears + 1 / 12,
    cash: round2(cash),
    baseExpensesMonthly: round2(expenses),
    grossIncomeAnnual: round2(grossIncomeAnnual),
    creditScore,
    burnout: round2(burnout),
    stress: round2(stress),
    debts: effResult.debts.map(d => ({
      ...d,
      balance: round2(d.balance),
      minPaymentMonthly: round2(d.minPaymentMonthly),
    })).filter(d => d.balance > 0.01),
    portfolio: {
      ...state.portfolio,
      taxable: round2(taxable),
      retirement: round2(retirement),
    },
    macro: nextMacro,
    lastChoice: choice,
    pendingEffects: remainingPendingEffects,
    history: [
      ...state.history,
      {
        monthIndex: state.monthIndex,
        cash: round2(state.cash),
        netWorth: round2(computeNetWorth(state)),
        creditScore: state.creditScore,
        stress: round2(state.stress),
        inflationAnnual: round2(state.macro.inflationAnnual),
        recessionProbAnnual: round2(state.macro.recessionProbAnnual),
        grossIncomeAnnual: round2(state.grossIncomeAnnual),
      },
    ],
  };

  // ─── Build debrief from the event just responded to (fix #4) ─────────────────
  const debrief: RoundDebrief = last
    ? {
        principle: last.debrief.principle,
        whyItHappened: last.debrief.whyItHappened,
        counterfactual: last.debrief.counterfactual,
        ruleOfThumb: last.debrief.ruleOfThumb,
        advisorQuestion: socraticAdvisorQuestion(state, last),
        firedEffects: effResult.firedLabels,
      }
    : {
        principle: "",
        whyItHappened: "",
        counterfactual: "",
        ruleOfThumb: "",
        advisorQuestion: "",
        firedEffects: [],
      };

  const result = nextEvent({ state: nextState });
  return { ...result, debrief };
}

// ─── Visible metrics ───────────────────────────────────────────────────────────
export function getVisibleMetrics(state: SimState): VisibleMetrics {
  const annualTax = taxAnnual({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const monthlyIncomeNet = computeNetMonthlyIncome({ grossIncomeAnnual: state.grossIncomeAnnual, annualTax });
  const investments = state.portfolio.taxable + state.portfolio.retirement;
  const totalDebt = sumDebt(state.debts);
  const dti = computeDTI(state);
  const bufferMonths = state.baseExpensesMonthly > 0 ? state.cash / state.baseExpensesMonthly : 0;
  return {
    netWorth: round2(computeNetWorth(state)),
    cash: round2(state.cash),
    stress: round2(state.stress),
    burnout: round2(state.burnout),
    creditScore: state.creditScore,
    dti: round2(dti),
    monthlyIncomeNet: round2(monthlyIncomeNet),
    monthlyExpenses: round2(state.baseExpensesMonthly + sumDebtPayments(state.debts)),
    totalDebt: round2(totalDebt),
    investments: round2(investments),
    inflationAnnual: round2(state.macro.inflationAnnual),
    recessionProbAnnual: round2(state.macro.recessionProbAnnual),
    bufferMonths: round2(bufferMonths),
    outcomeScore: computeOutcomeScore(state),
  };
}