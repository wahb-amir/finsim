const { getVisibleMetrics } = require("./engine");

const TOTAL_ROUNDS = 10;

function toUIMetrics(visibleMetrics, simState) {
  return {
    monthlyIncome: visibleMetrics.monthlyIncomeNet,
    monthlyExpenses: visibleMetrics.monthlyExpenses,
    savingsBalance: visibleMetrics.cash,
    totalDebt: visibleMetrics.totalDebt,
    creditScore: visibleMetrics.creditScore,
    retirementBalance: simState?.portfolio?.retirement ?? 0,
    debtToIncome: visibleMetrics.dti * 100,
    stressIndex: visibleMetrics.stress,
    netWorth: visibleMetrics.netWorth,
    inflationAnnual: visibleMetrics.inflationAnnual,
    recessionProbAnnual: visibleMetrics.recessionProbAnnual,
    investments: visibleMetrics.investments,
    burnout: visibleMetrics.burnout,
    bufferMonths: visibleMetrics.bufferMonths,
    outcomeScore: visibleMetrics.outcomeScore,
  };
}

function toStoredMetrics(visibleMetrics, simState) {
  const ui = toUIMetrics(visibleMetrics, simState);
  const monthlySurplus = ui.monthlyIncome - ui.monthlyExpenses;
  return {
    netWorth: ui.netWorth,
    creditScore: ui.creditScore,
    savingsBalance: ui.savingsBalance,
    investmentBalance: ui.investments,
    retirementBalance: ui.retirementBalance,
    totalDebt: ui.totalDebt,
    emergencyFundMonths: visibleMetrics.bufferMonths,
    monthlySurplus: Math.round(monthlySurplus * 100) / 100,
    stressIndex: ui.stressIndex,
    debtToIncome: ui.debtToIncome,
    is401kActive: ui.retirementBalance > 0,
    creditCardDebt: (simState?.debts || [])
      .filter((d) => d.kind === "credit-card")
      .reduce((s, d) => s + d.balance, 0),
    salary: simState?.grossIncomeAnnual,
  };
}

function deriveScenarioId(session) {
  const goal = String(session?.goal || "build-wealth");
  const climate = String(session?.climateLabel || "Stable").toLowerCase();
  const salary = Number(session?.startSalary || 0);

  if (goal === "avoid-debt" || climate === "recession") return "recession";
  if (goal === "understand-basics") return "single-parent";

  if (goal === "build-wealth") {
    if (climate === "volatile") return "startup-founder";
    if (salary >= 80000) return "startup-founder";
    return "baseline";
  }

  return "baseline";
}

function hashStringToSeed(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildGameView(session) {
  const simState = session.simState ?? session.simulationState;
  if (!simState) return null;

  const visible = getVisibleMetrics(simState);
  return {
    currentRound: session.currentRound,
    metrics: toUIMetrics(visible, simState),
    event: session.currentEvent,
    narrative: session.currentNarrative || null,
    status: session.status,
    scenarioId: session.scenarioId,
    ageYears: simState.ageYears,
  };
}

module.exports = {
  TOTAL_ROUNDS,
  toUIMetrics,
  toStoredMetrics,
  deriveScenarioId,
  hashStringToSeed,
  buildGameView,
};
