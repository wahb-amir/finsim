import { clamp, paymentAmortized, round2, stepAmortization, taxAnnual, type TaxBracket } from "./math";
import type { EventCard, MacroSnapshot, ChoiceId } from "./events";
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
  termMonths?: number; // for amortized loans
};

export type Portfolio = {
  taxable: number;
  retirement: number;
  equity: number; // founder equity fraction (0..1) - not directly liquid
};

export type SimState = {
  seed: number;
  scenarioId: ScenarioId;
  step: TimeStep;
  monthIndex: number; // 0-based
  ageYears: number;
  cash: number; // liquid cash
  grossIncomeAnnual: number;
  baseExpensesMonthly: number;
  creditScore: number; // 300..850
  burnout: number; // 0..100 (hidden-ish)
  stress: number; // 0..100
  debts: Debt[];
  portfolio: Portfolio;
  macro: MacroSnapshot;
  lastEvent?: EventCard;
  history: Array<{
    monthIndex: number;
    cash: number;
    netWorth: number;
    creditScore: number;
    stress: number;
    inflationAnnual: number;
    recessionProbAnnual: number;
  }>;
};

export type VisibleMetrics = {
  netWorth: number;
  cash: number;
  stress: number;
  creditScore: number;
  dti: number;
  monthlyIncomeNet: number;
  monthlyExpenses: number;
  totalDebt: number;
  investments: number;
  inflationAnnual: number;
  recessionProbAnnual: number;
};

export type StepResult = {
  state: SimState;
  event: EventCard;
  metrics: VisibleMetrics;
  narrative: {
    headline: string;
    advisorHint: string;
  };
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
  // 0 when buffer >= 6 months, rising sharply below 1 month.
  const months = expenses > 0 ? cash / expenses : 6;
  const normalized = clamp((6 - months) / 6, 0, 1);
  return normalized * normalized * 65; // up to 65 points from buffer
}

function stressFromDTI(dti: number): number {
  // DTI 0.2 ~ mild, 0.4 bad, 0.6 panic
  const x = clamp((dti - 0.15) / 0.55, 0, 1);
  return x * 30;
}

function bumpCreditScore({
  creditScore,
  onTime,
  utilization,
  newCreditLine,
  restrictedCredit,
}: {
  creditScore: number;
  onTime: boolean;
  utilization: number; // 0..1+
  newCreditLine: boolean;
  restrictedCredit: boolean;
}): number {
  let score = creditScore;
  if (onTime) score += 2;
  else score -= 18;

  // utilization sweet spot: 0.01..0.1
  if (utilization < 0.1) score += 2;
  else if (utilization < 0.3) score -= 1;
  else score -= 6;

  if (newCreditLine) score += restrictedCredit ? 3 : 6;
  return clamp(Math.round(score), 300, 850);
}

function advisorForState(state: SimState, event: EventCard): string {
  const dti = computeDTI(state);
  if (event.crisis && state.cash < state.baseExpensesMonthly * 1.2) {
    return "In a crisis, cash runway is oxygen. Protect your next 90 days first.";
  }
  if (dti > 0.4) return "High DTI is a gatekeeper. Attack APR and monthly obligations before chasing upside.";
  if (state.portfolio.taxable + state.portfolio.retirement < 500 && state.monthIndex > 6) {
    return "Consistency beats intensity. Automate a small investment you can maintain through stress.";
  }
  return "Ask: does this choice reduce fragility, or increase optionality? The best move is usually one of those.";
}

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
    const min =
      kindMap === "student" && term
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
    history: [],
  };

  return nextEvent({ state });
}

export function nextEvent({ state }: { state: SimState }): StepResult {
  const rng = createRng((state.seed + state.monthIndex * 2654435761) >>> 0);
  const dti = computeDTI(state);
  const event = generateEvent({
    rng,
    monthIndex: state.monthIndex,
    cash: state.cash,
    creditScore: state.creditScore,
    dti,
    scenarioFlags: {
      restrictedCredit: getScenario(state.scenarioId).modifiers.restrictedCredit,
      remittanceMonthly: getScenario(state.scenarioId).modifiers.remittanceMonthly,
      childcareMonthly: getScenario(state.scenarioId).modifiers.childcareMonthly,
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

export function applyChoice({
  state,
  choice,
}: {
  state: SimState;
  choice: ChoiceId;
}): StepResult {
  const scenario = getScenario(state.scenarioId);
  const rng = createRng((state.seed ^ (state.monthIndex + 1) * 2246822519) >>> 0);

  // Annual tax approximation on gross salary; founder w/ 0 salary pays 0.
  const annualTax = taxAnnual({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9), // rough: standard deduction + pre-tax effects
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const netIncomeMonthly = computeNetMonthlyIncome({ grossIncomeAnnual: state.grossIncomeAnnual, annualTax });

  // Macro evolves month-to-month (deterministic from seed + stress).
  const nextMacro = rollMacro({
    rng,
    baseInflationAnnual: scenario.modifiers.inflationAnnual,
    baseRecessionProbAnnual: scenario.modifiers.recessionProbAnnual,
    stressIndex: state.stress,
  });

  // Expenses drift with inflation.
  const inflationMonthly = Math.pow(1 + nextMacro.inflationAnnual, 1 / 12) - 1;
  let expenses = state.baseExpensesMonthly * (1 + inflationMonthly);

  // Decision effects (intentionally simple but real math-driven). Expand with more event types later.
  let investMonthly = 0;
  let extraDebtPayment = 0;
  let newCreditLine = false;
  let utilizationTarget = 0.08;

  const last = state.lastEvent;
  if (last?.tag === "budget") {
    if (choice === "left") {
      // auto-save rule
      investMonthly = 0;
      expenses *= 0.995;
    } else {
      // lifestyle inflation sticks
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
    } else {
      investMonthly = 0;
    }
  }

  if (last?.id?.startsWith("dti:")) {
    if (choice === "left") {
      extraDebtPayment = Math.max(0, (netIncomeMonthly - expenses) * 0.5);
    } else {
      extraDebtPayment = 0;
    }
  }

  // Cashflow: net income -> cash, then pay expenses, then debt minimums, then investing/debt extra.
  let cash = state.cash + netIncomeMonthly;

  // Pay expenses (if cash negative, spill into credit-card debt).
  cash -= expenses;
  const restrictedCredit = scenario.modifiers.restrictedCredit;
  if (cash < 0) {
    const spill = -cash;
    cash = 0;
    // Create or grow a credit-card-like revolving debt with high APR if allowed; otherwise create "medical" collections-like.
    const existingCC = state.debts.find((d) => d.kind === "credit-card");
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

  // Debt minimum payments + interest accrual.
  let onTime = true;
  const nextDebts: Debt[] = state.debts
    .map((d) => ({ ...d }))
    .map((d) => {
      if (d.balance <= 0) return d;
      const pay = Math.min(d.minPaymentMonthly, cash);
      if (pay + 1e-6 < d.minPaymentMonthly) onTime = false;
      cash -= pay;
      const stepped = stepAmortization({ balance: d.balance, annualRate: d.apr, payment: pay });
      return {
        ...d,
        balance: stepped.nextBalance,
        minPaymentMonthly:
          d.termMonths && d.kind !== "credit-card"
            ? round2(paymentAmortized({ principal: stepped.nextBalance, annualRate: d.apr, termMonths: Math.max(1, d.termMonths - 1) }))
            : round2(Math.max(35, stepped.nextBalance * 0.03)),
        termMonths: d.termMonths ? Math.max(0, d.termMonths - 1) : undefined,
      };
    })
    .filter((d) => d.balance > 0.01);

  // Extra debt payoff to highest APR.
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

  // Investing: taxable gets market return; retirement grows too (pretax simplification).
  const marketMonthly = Math.pow(1 + nextMacro.marketReturnAnnual, 1 / 12) - 1;
  const invest = Math.min(investMonthly, Math.max(0, cash));
  cash -= invest;

  const taxable = (state.portfolio.taxable + invest) * (1 + marketMonthly);
  const retirement = state.portfolio.retirement * (1 + marketMonthly);

  // Update credit score (utilization approximated from revolving debt / a pseudo-limit).
  const revolving = nextDebts.filter((d) => d.kind === "credit-card").reduce((s, d) => s + d.balance, 0);
  const pseudoLimit = restrictedCredit ? 1500 : 6000;
  const utilization = pseudoLimit > 0 ? revolving / pseudoLimit : 0;
  const creditScore = bumpCreditScore({
    creditScore: state.creditScore,
    onTime,
    utilization: Math.max(utilizationTarget, utilization),
    newCreditLine,
    restrictedCredit,
  });

  const dti = (() => {
    const grossMonthly = state.grossIncomeAnnual / 12;
    const debtPay = sumDebtPayments(nextDebts);
    return grossMonthly <= 1e-6 ? (debtPay > 0 ? 1 : 0) : clamp(debtPay / grossMonthly, 0, 2);
  })();

  const bufferStress = stressFromBuffer({ cash, expenses });
  const dtiStress = stressFromDTI(dti);
  const macroStress = clamp(nextMacro.recessionProbAnnual * 35 + nextMacro.inflationAnnual * 120, 0, 35);
  const burnout = clamp(state.burnout + scenario.modifiers.burnoutDriftMonthly + (choice === "right" ? 0.3 : -0.1), 0, 100);
  const stress = clamp(5 + bufferStress + dtiStress + macroStress + burnout * 0.15, 0, 100);

  // Wage growth drifts; in recession, wage growth can be negative with some probability.
  let grossIncomeAnnual = state.grossIncomeAnnual;
  const wageMonthly = Math.pow(1 + scenario.modifiers.wageGrowthAnnual, 1 / 12) - 1;
  grossIncomeAnnual = grossIncomeAnnual * (1 + wageMonthly);
  if (nextMacro.recessionProbAnnual > 0.25 && rng.next() < scenario.modifiers.layoffProbAnnual / 12) {
    grossIncomeAnnual = Math.max(0, grossIncomeAnnual * 0.5); // partial income shock
  }

  const nextState: SimState = {
    ...state,
    monthIndex: state.monthIndex + 1,
    ageYears: state.ageYears + 1 / 12,
    cash: round2(cash),
    baseExpensesMonthly: round2(expenses), // treat inflated expenses as new baseline
    grossIncomeAnnual: round2(grossIncomeAnnual),
    creditScore,
    burnout: round2(burnout),
    stress: round2(stress),
    debts: nextDebts.map((d) => ({ ...d, balance: round2(d.balance), minPaymentMonthly: round2(d.minPaymentMonthly) })),
    portfolio: { ...state.portfolio, taxable: round2(taxable), retirement: round2(retirement) },
    macro: nextMacro,
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
      },
    ],
  };

  return nextEvent({ state: nextState });
}

export function getVisibleMetrics(state: SimState): VisibleMetrics {
  const annualTax = taxAnnual({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const monthlyIncomeNet = computeNetMonthlyIncome({ grossIncomeAnnual: state.grossIncomeAnnual, annualTax });
  const investments = state.portfolio.taxable + state.portfolio.retirement;
  const totalDebt = sumDebt(state.debts);
  const dti = computeDTI(state);
  return {
    netWorth: round2(computeNetWorth(state)),
    cash: round2(state.cash),
    stress: round2(state.stress),
    creditScore: state.creditScore,
    dti: round2(dti),
    monthlyIncomeNet: round2(monthlyIncomeNet),
    monthlyExpenses: round2(state.baseExpensesMonthly + sumDebtPayments(state.debts)),
    totalDebt: round2(totalDebt),
    investments: round2(investments),
    inflationAnnual: round2(state.macro.inflationAnnual),
    recessionProbAnnual: round2(state.macro.recessionProbAnnual),
  };
}
