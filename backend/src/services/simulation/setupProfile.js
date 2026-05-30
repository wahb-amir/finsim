"use strict";

function applyClimateModifiers(modifiers, climateLabel) {
  const climate = String(climateLabel || "Stable").toLowerCase();
  const m = { ...modifiers };

  switch (climate) {
    case "inflation":
      m.inflationAnnual = (m.inflationAnnual || 0.025) + 0.025;
      m.recessionProbAnnual = (m.recessionProbAnnual || 0.12) + 0.04;
      m.wageGrowthAnnual = Math.max(0, (m.wageGrowthAnnual || 0.035) - 0.015);
      break;
    case "volatile":
      m.recessionProbAnnual = (m.recessionProbAnnual || 0.12) + 0.06;
      m.layoffProbAnnual = (m.layoffProbAnnual || 0.06) + 0.04;
      m.burnoutDriftMonthly = (m.burnoutDriftMonthly || 0.2) + 0.15;
      break;
    case "stable":
      m.wageGrowthAnnual = (m.wageGrowthAnnual || 0.035) + 0.005;
      m.inflationAnnual = Math.max(0.015, (m.inflationAnnual || 0.025) - 0.005);
      break;
    default:
      break;
  }

  return m;
}

function applyCareerModifiers(modifiers, career) {
  const c = String(career || "").toLowerCase();
  const m = { ...modifiers };

  if (/doctor|lawyer|pilot|engineer|accountant/.test(c)) {
    m.wageGrowthAnnual = (m.wageGrowthAnnual || 0.035) + 0.01;
  } else if (/teacher|nurse|social worker/.test(c)) {
    m.wageGrowthAnnual = Math.max(0.015, (m.wageGrowthAnnual || 0.035) - 0.005);
    m.burnoutDriftMonthly = Math.max(0.1, (m.burnoutDriftMonthly || 0.2) - 0.05);
  } else if (/entrepreneur|founder|business owner|startup/.test(c)) {
    m.burnoutDriftMonthly = (m.burnoutDriftMonthly || 0.2) + 0.2;
    m.layoffProbAnnual = Math.max(0, (m.layoffProbAnnual || 0.06) - 0.03);
  } else if (/electrician|sales|project manager/.test(c)) {
    m.wageGrowthAnnual = (m.wageGrowthAnnual || 0.035) + 0.005;
  }

  return m;
}

function scaleStartingState(scenarioStart, startSalary) {
  const salary = Number(startSalary);
  if (!salary || salary <= 0) {
    return {
      ...scenarioStart,
      debt: scenarioStart.debt ? { ...scenarioStart.debt } : { kind: "none", balance: 0, apr: 0 },
      investments: scenarioStart.investments ? { ...scenarioStart.investments } : {},
    };
  }

  const baseSalary = scenarioStart.grossSalaryAnnual || 48000;
  const ratio = baseSalary > 0 ? salary / baseSalary : 1;
  const expenseRatio = Math.pow(ratio, 0.85);

  const scaled = {
    ...scenarioStart,
    grossSalaryAnnual: salary,
    baseExpensesMonthly: Math.round((scenarioStart.baseExpensesMonthly || 1800) * expenseRatio),
    cash: Math.round((scenarioStart.cash || 800) * Math.min(Math.max(ratio, 0.5), 2.5)),
    investments: scenarioStart.investments ? { ...scenarioStart.investments } : {},
    debt: scenarioStart.debt ? { ...scenarioStart.debt } : { kind: "none", balance: 0, apr: 0 },
  };

  if (scenarioStart.debt?.balance > 0) {
    scaled.debt = {
      ...scenarioStart.debt,
      balance: Math.round(scenarioStart.debt.balance * Math.min(Math.max(ratio, 0.6), 1.8)),
    };
  }

  return scaled;
}

function buildSetupProfile(scenario, { startSalary, climateLabel, career } = {}) {
  let modifiers = applyClimateModifiers(scenario.modifiers, climateLabel);
  modifiers = applyCareerModifiers(modifiers, career);
  const start = scaleStartingState(scenario.start, startSalary);
  return { modifiers, start };
}

module.exports = {
  applyClimateModifiers,
  applyCareerModifiers,
  scaleStartingState,
  buildSetupProfile,
};
