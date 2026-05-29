export type ScenarioId =
  | "baseline"
  | "recession"
  | "startup-founder"
  | "immigrant-household"
  | "single-parent";

export type Scenario = {
  id: ScenarioId;
  name: string;
  tagline: string;
  modifiers: {
    wageGrowthAnnual: number; // baseline wage growth
    inflationAnnual: number; // starting inflation
    recessionProbAnnual: number; // baseline recession probability
    layoffProbAnnual: number;
    burnoutDriftMonthly: number; // baseline burnout drift
    restrictedCredit: boolean;
    remittanceMonthly: number;
    childcareMonthly: number;
    healthcareRiskAnnual: number;
  };
  start: {
    ageYears: number;
    cash: number;
    grossSalaryAnnual: number;
    baseExpensesMonthly: number;
    creditScore: number;
    debt: {
      kind: "none" | "credit-card" | "student" | "car";
      balance: number;
      apr: number;
      termMonths?: number;
    };
    investments: {
      taxable: number;
      retirement: number;
      equity: number; // for founder mode
    };
  };
};

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "baseline",
    name: "Baseline",
    tagline: "A normal start with normal risks.",
    modifiers: {
      wageGrowthAnnual: 0.035,
      inflationAnnual: 0.025,
      recessionProbAnnual: 0.12,
      layoffProbAnnual: 0.06,
      burnoutDriftMonthly: 0.2,
      restrictedCredit: false,
      remittanceMonthly: 0,
      childcareMonthly: 0,
      healthcareRiskAnnual: 0.04,
    },
    start: {
      ageYears: 22,
      cash: 800,
      grossSalaryAnnual: 48000,
      baseExpensesMonthly: 1800,
      creditScore: 680,
      debt: { kind: "none", balance: 0, apr: 0 },
      investments: { taxable: 0, retirement: 0, equity: 0 },
    },
  },
  {
    id: "recession",
    name: "Recession Mode",
    tagline: "Inflation bites. Wages lag. Layoffs loom.",
    modifiers: {
      wageGrowthAnnual: 0.01,
      inflationAnnual: 0.055,
      recessionProbAnnual: 0.28,
      layoffProbAnnual: 0.12,
      burnoutDriftMonthly: 0.35,
      restrictedCredit: false,
      remittanceMonthly: 0,
      childcareMonthly: 0,
      healthcareRiskAnnual: 0.06,
    },
    start: {
      ageYears: 22,
      cash: 700,
      grossSalaryAnnual: 46000,
      baseExpensesMonthly: 1750,
      creditScore: 660,
      debt: { kind: "credit-card", balance: 600, apr: 0.219 },
      investments: { taxable: 0, retirement: 0, equity: 0 },
    },
  },
  {
    id: "startup-founder",
    name: "Startup Founder Mode",
    tagline: "$0 salary. Equity upside. Burnout danger.",
    modifiers: {
      wageGrowthAnnual: 0.0,
      inflationAnnual: 0.03,
      recessionProbAnnual: 0.18,
      layoffProbAnnual: 0.0,
      burnoutDriftMonthly: 0.75,
      restrictedCredit: true,
      remittanceMonthly: 0,
      childcareMonthly: 0,
      healthcareRiskAnnual: 0.05,
    },
    start: {
      ageYears: 24,
      cash: 6000,
      grossSalaryAnnual: 0,
      baseExpensesMonthly: 2200,
      creditScore: 640,
      debt: { kind: "none", balance: 0, apr: 0 },
      investments: { taxable: 0, retirement: 0, equity: 0.006 }, // 0.6% fully diluted
    },
  },
  {
    id: "immigrant-household",
    name: "Immigrant Household Mode",
    tagline: "Remittances. Restricted credit. High savings drive.",
    modifiers: {
      wageGrowthAnnual: 0.04,
      inflationAnnual: 0.03,
      recessionProbAnnual: 0.14,
      layoffProbAnnual: 0.07,
      burnoutDriftMonthly: 0.25,
      restrictedCredit: true,
      remittanceMonthly: 350,
      childcareMonthly: 0,
      healthcareRiskAnnual: 0.05,
    },
    start: {
      ageYears: 25,
      cash: 1200,
      grossSalaryAnnual: 52000,
      baseExpensesMonthly: 1900,
      creditScore: 620,
      debt: { kind: "student", balance: 9000, apr: 0.055, termMonths: 120 },
      investments: { taxable: 0, retirement: 0, equity: 0 },
    },
  },
  {
    id: "single-parent",
    name: "Single Parent Mode",
    tagline: "Childcare overhead. Healthcare risk. Less time capacity.",
    modifiers: {
      wageGrowthAnnual: 0.03,
      inflationAnnual: 0.03,
      recessionProbAnnual: 0.14,
      layoffProbAnnual: 0.08,
      burnoutDriftMonthly: 0.45,
      restrictedCredit: false,
      remittanceMonthly: 0,
      childcareMonthly: 650,
      healthcareRiskAnnual: 0.085,
    },
    start: {
      ageYears: 27,
      cash: 900,
      grossSalaryAnnual: 54000,
      baseExpensesMonthly: 2100,
      creditScore: 650,
      debt: { kind: "credit-card", balance: 1400, apr: 0.249 },
      investments: { taxable: 0, retirement: 800, equity: 0 },
    },
  },
] as const;

export function getScenario(id: ScenarioId): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
