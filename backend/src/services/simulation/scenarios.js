"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var scenarios_exports = {};
__export(scenarios_exports, {
  SCENARIOS: () => SCENARIOS,
  getScenario: () => getScenario
});
module.exports = __toCommonJS(scenarios_exports);
const SCENARIOS = [
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
      healthcareRiskAnnual: 0.04
    },
    start: {
      ageYears: 22,
      cash: 800,
      grossSalaryAnnual: 48e3,
      baseExpensesMonthly: 1800,
      creditScore: 680,
      debt: { kind: "none", balance: 0, apr: 0 },
      investments: { taxable: 0, retirement: 0, equity: 0 }
    }
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
      healthcareRiskAnnual: 0.06
    },
    start: {
      ageYears: 22,
      cash: 700,
      grossSalaryAnnual: 46e3,
      baseExpensesMonthly: 1750,
      creditScore: 660,
      debt: { kind: "credit-card", balance: 600, apr: 0.219 },
      investments: { taxable: 0, retirement: 0, equity: 0 }
    }
  },
  {
    id: "startup-founder",
    name: "Startup Founder Mode",
    tagline: "$0 salary. Equity upside. Burnout danger.",
    modifiers: {
      wageGrowthAnnual: 0,
      inflationAnnual: 0.03,
      recessionProbAnnual: 0.18,
      layoffProbAnnual: 0,
      burnoutDriftMonthly: 0.75,
      restrictedCredit: true,
      remittanceMonthly: 0,
      childcareMonthly: 0,
      healthcareRiskAnnual: 0.05
    },
    start: {
      ageYears: 24,
      cash: 6e3,
      grossSalaryAnnual: 0,
      baseExpensesMonthly: 2200,
      creditScore: 640,
      debt: { kind: "none", balance: 0, apr: 0 },
      investments: { taxable: 0, retirement: 0, equity: 6e-3 }
      // 0.6% fully diluted — drives equity events
    }
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
      healthcareRiskAnnual: 0.05
    },
    start: {
      ageYears: 25,
      cash: 1200,
      grossSalaryAnnual: 52e3,
      baseExpensesMonthly: 1900,
      creditScore: 620,
      debt: { kind: "student", balance: 9e3, apr: 0.055, termMonths: 120 },
      investments: { taxable: 0, retirement: 0, equity: 0 }
    }
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
      healthcareRiskAnnual: 0.085
    },
    start: {
      ageYears: 27,
      cash: 900,
      grossSalaryAnnual: 54e3,
      baseExpensesMonthly: 2100,
      creditScore: 650,
      debt: { kind: "credit-card", balance: 1400, apr: 0.249 },
      investments: { taxable: 0, retirement: 800, equity: 0 }
    }
  }
];
function getScenario(id) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCENARIOS,
  getScenario
});
