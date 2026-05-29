import { clamp } from "./math";
import type { RNG } from "./prng";

export type EventTag =
  | "budget"
  | "credit"
  | "car"
  | "health"
  | "career"
  | "housing"
  | "investing"
  | "macro";

export type ChoiceId = "left" | "right";

export type Choice = {
  id: ChoiceId;
  title: string;
  bullets: string[];
};

export type EventCard = {
  id: string;
  tag: EventTag;
  title: string;
  description: string;
  crisis: boolean;
  left: Choice;
  right: Choice;
};

export type MacroSnapshot = {
  inflationAnnual: number; // realized inflation used this month
  recessionProbAnnual: number;
  marketReturnAnnual: number; // expected nominal return for this month step
};

export function rollMacro({
  rng,
  baseInflationAnnual,
  baseRecessionProbAnnual,
  stressIndex,
}: {
  rng: RNG;
  baseInflationAnnual: number;
  baseRecessionProbAnnual: number;
  stressIndex: number;
}): MacroSnapshot {
  // Inflation drifts around scenario baseline; recession probability rises when stress is high.
  const inflationShock = (rng.next() - 0.5) * 0.02; // +/- 1% annual shock
  const inflationAnnual = clamp(
    baseInflationAnnual + inflationShock,
    0.0,
    0.12,
  );

  const stressFactor = clamp((stressIndex - 30) / 70, 0, 1);
  const recessionProbAnnual = clamp(
    baseRecessionProbAnnual + stressFactor * 0.12 + (rng.next() - 0.5) * 0.04,
    0,
    0.65,
  );

  // Market expected return falls with inflation and recession probability.
  const marketReturnAnnual = clamp(
    0.08 - inflationAnnual * 0.7 - recessionProbAnnual * 0.12,
    -0.25,
    0.15,
  );

  return { inflationAnnual, recessionProbAnnual, marketReturnAnnual };
}

export function generateEvent({
  rng,
  monthIndex,
  cash,
  creditScore,
  dti,
  scenarioFlags,
  macro,
}: {
  rng: RNG;
  monthIndex: number;
  cash: number;
  creditScore: number;
  dti: number;
  scenarioFlags: {
    restrictedCredit: boolean;
    remittanceMonthly: number;
    childcareMonthly: number;
  };
  macro: MacroSnapshot;
}): EventCard {
  // Deterministic but state-aware selection. Keep deck small for now; expand later.
  const cashTight = cash < 1200;
  const creditThin = creditScore < 660 || scenarioFlags.restrictedCredit;
  const highDti = dti > 0.35;
  const crisisRoll = rng.next();
  const macroCrisis = macro.recessionProbAnnual > 0.25 && crisisRoll < 0.2;

  // Weighted pick
  const candidates: EventCard[] = [];

  candidates.push({
    id: `budget:${monthIndex}`,
    tag: "budget",
    title: cashTight
      ? "The buffer is evaporating"
      : "Budget surplus: allocate it",
    description: cashTight
      ? "Your checking account is thin. One surprise expense would spill you into high-interest debt."
      : "You have a little breathing room this month. Small consistent moves compound into big outcomes.",
    crisis: cashTight,
    left: {
      id: "left",
      title: "Lock an emergency fund rule",
      bullets: [
        "Auto-save a fixed amount monthly",
        "Stress drops if buffer reaches 3–6 months",
        "Slower discretionary spending now",
      ],
    },
    right: {
      id: "right",
      title: "Spend the surplus (lifestyle upgrade)",
      bullets: [
        "Immediate quality-of-life boost",
        "Higher baseline expenses persist",
        "Harder to recover after shocks",
      ],
    },
  });

  if (creditThin) {
    candidates.push({
      id: `credit:${monthIndex}`,
      tag: "credit",
      title: "A credit line offer arrives",
      description:
        "A bank offers a card limit sized to your profile. Used well, it can build your score; used poorly, it compounds against you.",
      crisis: false,
      left: {
        id: "left",
        title: "Accept + autopay full statement",
        bullets: [
          "Builds history over time",
          "Low utilization target (<10%)",
          "Requires discipline every month",
        ],
      },
      right: {
        id: "right",
        title: "Decline (cash-only)",
        bullets: [
          "No revolving-debt risk",
          "Score grows slower",
          "Loan terms may be worse later",
        ],
      },
    });
  }

  candidates.push({
    id: `invest:${monthIndex}`,
    tag: "investing",
    title: "The market offers patience (and pain)",
    description:
      "Markets compound quietly most months, then punish panic when volatility spikes. Your contribution rate matters more than your timing.",
    crisis: macroCrisis,
    left: {
      id: "left",
      title: "Automate index investing",
      bullets: [
        "Monthly contributions",
        "Long horizon compounds",
        "Drawdowns happen but are survivable with cash buffer",
      ],
    },
    right: {
      id: "right",
      title: "Hold cash until things “feel safe”",
      bullets: [
        "Less volatility stress",
        "Opportunity cost during rebounds",
        "Inflation quietly erodes purchasing power",
      ],
    },
  });

  if (
    scenarioFlags.childcareMonthly > 0 ||
    scenarioFlags.remittanceMonthly > 0
  ) {
    candidates.push({
      id: `obligations:${monthIndex}`,
      tag: "budget",
      title: "Obligations don’t care about markets",
      description:
        "Some expenses are non-negotiable. The question is how you design the rest of your life around them.",
      crisis: cashTight,
      left: {
        id: "left",
        title: "Cut discretionary spending hard",
        bullets: [
          "Protects obligations",
          "Stress eases with predictability",
          "Short-term regret and social friction",
        ],
      },
      right: {
        id: "right",
        title: "Bridge with credit “just this month”",
        bullets: [
          "Feels painless now",
          "APR compounds quickly",
          "Credit score can slip if utilization spikes",
        ],
      },
    });
  }

  if (highDti) {
    candidates.push({
      id: `dti:${monthIndex}`,
      tag: "credit",
      title: "Your DTI is a silent gatekeeper",
      description:
        "High monthly debt payments reduce loan eligibility and raise stress. Paying down expensive debt is a guaranteed return.",
      crisis: true,
      left: {
        id: "left",
        title: "Attack highest APR debt",
        bullets: [
          "Guaranteed return equals APR",
          "DTI improves over months",
          "Stress relief is real and immediate",
        ],
      },
      right: {
        id: "right",
        title: "Minimum payments + keep lifestyle",
        bullets: [
          "Avoids short-term sacrifice",
          "Interest drags for years",
          "Loan options shrink when you need them most",
        ],
      },
    });
  }

  // Deterministic pick with state-skew.
  const idx = rng.int(0, candidates.length - 1);
  return candidates[idx];
}
