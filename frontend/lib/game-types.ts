/** UI/event types for the game client (simulation logic lives on the server). */

export type ChoiceId = "left" | "right";

export type Choice = {
  id: ChoiceId;
  title: string;
  bullets: string[];
};

export type EventCard = {
  id: string;
  tag: string;
  title: string;
  description: string;
  crisis: boolean;
  left: Choice;
  right: Choice;
  debrief?: {
    principle: string;
    whyItHappened: string;
    counterfactual: string;
    ruleOfThumb: string;
  };
};

export type UIMetrics = {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsBalance: number;
  totalDebt: number;
  creditScore: number;
  retirementBalance: number;
  debtToIncome: number;
  stressIndex: number;
  netWorth: number;
  inflationAnnual: number;
  recessionProbAnnual: number;
  investments: number;
  burnout?: number;
  bufferMonths?: number;
};
