import { clamp } from "./math";
import type { RNG } from "./prng";

// ─── Tag taxonomy ──────────────────────────────────────────────────────────────
export type EventTag =
  | "budget"
  | "credit"
  | "car"
  | "health"
  | "career"
  | "housing"
  | "investing"
  | "macro"
  | "family"
  | "insurance"
  | "behavioral"
  | "opportunity"
  | "shock"
  | "retirement"
  | "tax";

export type ChoiceId = "left" | "right";

export type Choice = {
  id: ChoiceId;
  title: string;
  bullets: string[];
};

// ─── Educational debrief layer (fix #4 & #6) ──────────────────────────────────
export type Debrief = {
  principle: string;
  whyItHappened: string;
  counterfactual: string;
  ruleOfThumb: string;
};

// ─── Delayed consequence (fix #5) ─────────────────────────────────────────────
export type DelayedEffect = {
  triggerMonthOffset: number;
  label: string;
  cashDelta?: number;
  stressDelta?: number;
  creditDelta?: number;
  expenseMultiplier?: number;
  incomeMultiplier?: number;
  debtAdd?: { kind: "credit-card" | "medical"; balance: number; apr: number };
};

export type EventCard = {
  id: string;
  tag: EventTag;
  title: string;
  description: string;
  crisis: boolean;
  left: Choice;
  right: Choice;
  debrief: Debrief;
  leftEffects?: DelayedEffect[];
  rightEffects?: DelayedEffect[];
};

// ─── Macro ────────────────────────────────────────────────────────────────────
export type MacroSnapshot = {
  inflationAnnual: number;
  recessionProbAnnual: number;
  marketReturnAnnual: number;
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
  const inflationShock = (rng.next() - 0.5) * 0.02;
  const inflationAnnual = clamp(baseInflationAnnual + inflationShock, 0.0, 0.12);
  const stressFactor = clamp((stressIndex - 30) / 70, 0, 1);
  const recessionProbAnnual = clamp(
    baseRecessionProbAnnual + stressFactor * 0.12 + (rng.next() - 0.5) * 0.04,
    0,
    0.65,
  );
  const marketReturnAnnual = clamp(
    0.08 - inflationAnnual * 0.7 - recessionProbAnnual * 0.12,
    -0.25,
    0.15,
  );
  return { inflationAnnual, recessionProbAnnual, marketReturnAnnual };
}

// ─── Scenario flags ───────────────────────────────────────────────────────────
export type ScenarioEventFlags = {
  restrictedCredit: boolean;
  remittanceMonthly: number;
  childcareMonthly: number;
  healthcareRiskAnnual: number;
  layoffProbAnnual: number;
  burnoutDriftMonthly: number;
  hasEquity: boolean;
};

// ─── Event builders ───────────────────────────────────────────────────────────

function budgetSurplusEvent(monthIndex: number, cashTight: boolean): EventCard {
  return {
    id: `budget:${monthIndex}`,
    tag: "budget",
    title: cashTight ? "The buffer is evaporating" : "Budget surplus: allocate it",
    description: cashTight
      ? "Your checking account is thin. One surprise expense could push you into high-interest debt."
      : "You have breathing room this month. Small consistent moves compound into big outcomes.",
    crisis: cashTight,
    left: {
      id: "left",
      title: "Lock an emergency fund rule",
      bullets: [
        "Auto-save a fixed amount monthly",
        "Stress drops as buffer reaches 3-6 months",
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
    debrief: {
      principle: "Automate savings before spending; what isn't saved gets spent.",
      whyItHappened: "Your monthly cash flow created a decision point about allocation priority.",
      counterfactual: "Saving $200/month compounds to ~$26k in 10 years at 7% — before any raises.",
      ruleOfThumb: "Pay yourself first: auto-transfer savings before your spending account sees the money.",
    },
    rightEffects: [
      { triggerMonthOffset: 3, label: "Lifestyle creep locked in. Expenses are stickier than expected.", expenseMultiplier: 1.02 },
    ],
  };
}

function creditLineEvent(monthIndex: number, restrictedCredit: boolean): EventCard {
  return {
    id: `credit:${monthIndex}`,
    tag: "credit",
    title: "A credit line offer arrives",
    description: "A bank offers a card sized to your profile. Used well it builds your score; used poorly it compounds against you.",
    crisis: false,
    left: {
      id: "left",
      title: "Accept + autopay full statement",
      bullets: [
        "Builds payment history (35% of score)",
        "Keep utilization under 10%",
        "Requires discipline every month",
      ],
    },
    right: {
      id: "right",
      title: "Decline (cash-only for now)",
      bullets: [
        "No revolving-debt risk",
        "Score grows slower without history",
        "Loan terms may worsen when you need credit",
      ],
    },
    debrief: {
      principle: "Credit is a tool — the same line can build or destroy depending on your discipline.",
      whyItHappened: "A thin credit file limits loan options. A new tradeline helps if managed correctly.",
      counterfactual: "Accepting and staying under 10% utilization adds 15-30 points over 12 months.",
      ruleOfThumb: "Never carry a balance. Treat the card like a debit card that reports to bureaus.",
    },
    leftEffects: [
      { triggerMonthOffset: 6, label: "On-time payment streak improved your credit score.", creditDelta: 20 },
    ],
  };
}

function investingPatience(monthIndex: number, macroCrisis: boolean): EventCard {
  return {
    id: `invest:${monthIndex}`,
    tag: "investing",
    title: "The market offers patience (and pain)",
    description: "Markets compound quietly most months, then punish panic when volatility spikes. Contribution rate matters more than timing.",
    crisis: macroCrisis,
    left: {
      id: "left",
      title: "Automate index investing",
      bullets: [
        "Monthly contributions regardless of price",
        "Long horizon survives drawdowns",
        "Dollar-cost averaging removes timing pressure",
      ],
    },
    right: {
      id: "right",
      title: "Hold cash until it feels safe",
      bullets: [
        "Less short-term volatility stress",
        "Opportunity cost during rebounds is real",
        "Inflation quietly erodes purchasing power",
      ],
    },
    debrief: {
      principle: "Time in the market beats timing the market — compounding requires staying invested.",
      whyItHappened: "Market volatility triggers loss-aversion bias. Waiting for 'safe' usually means buying higher.",
      counterfactual: "Missing the 10 best market days per decade can halve your long-run returns.",
      ruleOfThumb: "Automate investing so emotion can't override the decision.",
    },
    rightEffects: [
      { triggerMonthOffset: 12, label: "You sat out a recovery rally. Opportunity cost stings.", stressDelta: 8 },
    ],
    leftEffects: [
      { triggerMonthOffset: 6, label: "Consistent contributions compounding. Buffer feels more secure.", stressDelta: -4 },
    ],
  };
}

function obligationsEvent(monthIndex: number, cashTight: boolean): EventCard {
  return {
    id: `obligations:${monthIndex}`,
    tag: "budget",
    title: "Obligations don't care about markets",
    description: "Some expenses are non-negotiable. The question is how you design the rest of your life around them.",
    crisis: cashTight,
    left: {
      id: "left",
      title: "Cut discretionary spending hard",
      bullets: [
        "Protects non-negotiable obligations",
        "Predictability reduces stress",
        "Short-term social friction",
      ],
    },
    right: {
      id: "right",
      title: "Bridge with credit just this month",
      bullets: [
        "Feels painless now",
        "APR compounds quickly",
        "Utilization spike can hurt credit score",
      ],
    },
    debrief: {
      principle: "Fixed obligations are the floor — your lifestyle must fit in what remains above them.",
      whyItHappened: "Non-negotiable payments compressed your discretionary margin to near zero.",
      counterfactual: "One month of credit bridging at 24.9% APR on $600 costs $12. The habit costs far more.",
      ruleOfThumb: "Budget obligations first, savings second, discretionary last.",
    },
    rightEffects: [
      { triggerMonthOffset: 2, label: "The 'just this month' bridge became a habit. Interest compounding.", debtAdd: { kind: "credit-card", balance: 400, apr: 0.249 } },
    ],
  };
}

function dtiCrisisEvent(monthIndex: number): EventCard {
  return {
    id: `dti:${monthIndex}`,
    tag: "credit",
    title: "Your DTI is a silent gatekeeper",
    description: "High monthly debt payments reduce loan eligibility and raise stress. Paying down expensive debt is a guaranteed return equal to the APR.",
    crisis: true,
    left: {
      id: "left",
      title: "Attack highest-APR debt aggressively",
      bullets: [
        "Guaranteed return equals the APR",
        "DTI improves over months",
        "Immediate stress relief",
      ],
    },
    right: {
      id: "right",
      title: "Minimum payments, keep lifestyle",
      bullets: [
        "Avoids short-term sacrifice",
        "Interest drag persists for years",
        "Loan options shrink when you need them most",
      ],
    },
    debrief: {
      principle: "Paying off a 22% APR debt is a guaranteed 22% return — better than almost any investment.",
      whyItHappened: "Your debt-to-income ratio exceeded 35%, the threshold lenders use to deny new credit.",
      counterfactual: "Paying $200/month extra on a $2,400 credit card at 22% APR eliminates it 18 months sooner and saves $480.",
      ruleOfThumb: "Avalanche method: always attack the highest APR first.",
    },
    leftEffects: [
      { triggerMonthOffset: 4, label: "Debt paydown working. DTI dropped, stress eased.", stressDelta: -10, creditDelta: 15 },
    ],
    rightEffects: [
      { triggerMonthOffset: 6, label: "Minimum payments kept debt alive. Interest eroded your buffer.", cashDelta: -250 },
    ],
  };
}

function healthcareShockEvent(monthIndex: number, severe: boolean, healthcare: number): EventCard {
  const cost = severe ? 3400 : 820;
  return {
    id: `health:${monthIndex}`,
    tag: "health",
    title: severe ? "Unexpected medical bill arrives" : "Minor health expense, big question",
    description: severe
      ? "A significant medical bill landed. This is why the emergency fund exists."
      : "A minor health issue requires out-of-pocket spending. Pay cash or use credit?",
    crisis: severe,
    left: {
      id: "left",
      title: severe ? "Pay from emergency fund / savings" : "Pay cash, rebuild buffer next month",
      bullets: [
        "Avoids high-interest debt",
        "Buffer takes a hit -- rebuild it",
        "Credit score unaffected",
      ],
    },
    right: {
      id: "right",
      title: "Put it on credit, deal later",
      bullets: [
        "Preserves cash short-term",
        `$${cost} at 22%+ APR grows quickly`,
        "Stress often rises when debt is unresolved",
      ],
    },
    debrief: {
      principle: "Health emergencies are not 'if' -- they're 'when'. Insurance and an emergency fund are the answer.",
      whyItHappened: `Healthcare risk in your scenario is ${Math.round(healthcare * 100)}% annual probability of a significant expense.`,
      counterfactual: `With $3,000 in an emergency fund, a $${cost} bill is a setback, not a crisis.`,
      ruleOfThumb: "Budget 3-5% of annual income for healthcare surprises. It is not an optional line item.",
    },
    rightEffects: [
      { triggerMonthOffset: 3, label: "Medical debt compounding. Utilization rose, dinging your credit.", creditDelta: -12, stressDelta: 8 },
    ],
    leftEffects: [
      { triggerMonthOffset: 1, label: "Emergency fund absorbed the shock. Rebuild the buffer now.", stressDelta: -5 },
    ],
  };
}

function careerOpportunityEvent(monthIndex: number, currentIncome: number): EventCard {
  const raiseAmount = Math.round(currentIncome * 0.12);
  return {
    id: `career:${monthIndex}`,
    tag: "career",
    title: "A better offer landed in your inbox",
    description: "Another company wants you. The offer is meaningfully higher but changing jobs means rebuilding relationships and short-term uncertainty.",
    crisis: false,
    left: {
      id: "left",
      title: `Take the new job (+$${raiseAmount.toLocaleString()}/yr)`,
      bullets: [
        "Salary resets your income ceiling",
        "Job-switching is historically the fastest raise",
        "Short-term disruption, long-term compounding",
      ],
    },
    right: {
      id: "right",
      title: "Stay and negotiate a counter-offer",
      bullets: [
        "Less disruption risk",
        "Counter-offer may fall short",
        "Loyalty raises rarely match market rates",
      ],
    },
    debrief: {
      principle: "Job-switching is the fastest salary growth lever for most workers under 40.",
      whyItHappened: "Your skills increased, but your employer's raise budget didn't keep pace with market rates.",
      counterfactual: `A $${raiseAmount.toLocaleString()} raise compounded over 10 years at 3.5% annual growth adds over $${Math.round(raiseAmount * 11.7).toLocaleString()} in cumulative income.`,
      ruleOfThumb: "Benchmark your salary annually. Switching every 2-4 years when underpaid is rational, not disloyal.",
    },
    leftEffects: [
      { triggerMonthOffset: 0, label: `New job confirmed. Income up by $${raiseAmount.toLocaleString()}/year.`, incomeMultiplier: 1.12 },
      { triggerMonthOffset: 2, label: "New role demanding. Burnout ticked up slightly.", stressDelta: 7 },
    ],
    rightEffects: [
      { triggerMonthOffset: 1, label: "Counter-offer came in below market. You accepted anyway.", incomeMultiplier: 1.04 },
    ],
  };
}

function housingRentVsBuyEvent(monthIndex: number, creditScore: number, cash: number): EventCard {
  const canAffordDown = cash > 20000;
  const goodCredit = creditScore >= 700;
  return {
    id: `housing:${monthIndex}`,
    tag: "housing",
    title: "Your lease is up. Buy or keep renting?",
    description: canAffordDown && goodCredit
      ? "You are approaching the threshold where buying could make financial sense — if you plan to stay 5+ years."
      : "Buying may be premature given your current reserves. Renting preserves optionality, but rent inflation is real.",
    crisis: false,
    left: {
      id: "left",
      title: canAffordDown && goodCredit ? "Explore buying (lock in fixed cost)" : "Stay renting (preserve mobility)",
      bullets: canAffordDown && goodCredit
        ? ["Fixed mortgage beats rent inflation long-term", "Down payment is a large cash hit", "Only worth it if you stay 5+ years"]
        : ["No down payment drain", "Full flexibility to move for income", "Rent will rise with inflation"],
    },
    right: {
      id: "right",
      title: canAffordDown && goodCredit ? "Keep renting (flexibility)" : "Start saving aggressively for a down payment",
      bullets: canAffordDown && goodCredit
        ? ["Rent increases compound over time", "No equity but no illiquidity either", "Good if you expect to move within 3 years"]
        : ["A 20% down payment avoids PMI (~$100-200/month)", "Requires 2-3 years of focused saving", "Better credit means better rates"],
    },
    debrief: {
      principle: "The rent-vs-buy decision is primarily about time horizon, not monthly payment.",
      whyItHappened: "Housing is a major financial decision tied to credit, liquidity, and expected tenure.",
      counterfactual: "Buying with less than 5% down and under 700 credit score often costs more than renting in the first 5 years due to PMI, closing costs, and higher rates.",
      ruleOfThumb: "Run the 5% rule: annual buy cost = 5% of home value. If rent < that, renting may win.",
    },
    leftEffects: canAffordDown && goodCredit
      ? [{ triggerMonthOffset: 2, label: "Mortgage locked. Fixed housing cost replaces rising rent.", expenseMultiplier: 0.97 }]
      : [],
  };
}

function jobLossEvent(monthIndex: number, layoffProb: number): EventCard {
  return {
    id: `layoff:${monthIndex}`,
    tag: "career",
    title: "Your position has been eliminated",
    description: "It came without much warning. Your runway is your lifeline. Every month without income matters.",
    crisis: true,
    left: {
      id: "left",
      title: "Cut all non-essentials immediately",
      bullets: [
        "Extends runway significantly",
        "Preserves emergency fund",
        "Reduces stress by restoring perceived control",
      ],
    },
    right: {
      id: "right",
      title: "Maintain lifestyle, job-hunt intensely",
      bullets: [
        "Less lifestyle disruption",
        "Buffer depletes 30-40% faster",
        "Hiring takes 3-6 months on average",
      ],
    },
    debrief: {
      principle: "In a layoff, cash runway IS your negotiating power -- with recruiters, landlords, and yourself.",
      whyItHappened: `Your scenario has a ${Math.round(layoffProb * 100)}% annual layoff probability. Macro downturns amplify this.`,
      counterfactual: "A 6-month emergency fund transforms a job loss from a crisis into a planned transition.",
      ruleOfThumb: "Cut non-essentials within 2 weeks of a layoff. Every month of runway is a month of negotiating power.",
    },
    leftEffects: [
      { triggerMonthOffset: 0, label: "Expenses cut. Runway extended. Stress high but manageable.", expenseMultiplier: 0.6, stressDelta: 15, incomeMultiplier: 0 },
      { triggerMonthOffset: 5, label: "New job found. Income restored with negotiated raise.", incomeMultiplier: 1.07 },
    ],
    rightEffects: [
      { triggerMonthOffset: 0, label: "Lifestyle maintained. Buffer draining fast.", stressDelta: 20, incomeMultiplier: 0 },
      { triggerMonthOffset: 4, label: "Hired under pressure. Starting salary matched old one only.", incomeMultiplier: 1.0 },
    ],
  };
}

function insuranceGapEvent(monthIndex: number): EventCard {
  return {
    id: `insurance:${monthIndex}`,
    tag: "insurance",
    title: "Your renter's insurance lapsed",
    description: "You have been paying for insurance but wondering if it is worth it. A single incident could wipe out everything you own.",
    crisis: false,
    left: {
      id: "left",
      title: "Keep / renew coverage",
      bullets: [
        "$15-25/month covers tens of thousands in loss",
        "Liability coverage protects against lawsuits",
        "Peace of mind has real economic value",
      ],
    },
    right: {
      id: "right",
      title: "Drop it, save the premium",
      bullets: [
        "Saves ~$200/year",
        "One incident could cost $5,000-$50,000",
        "Self-insuring only works with significant assets",
      ],
    },
    debrief: {
      principle: "Insurance protects against low-probability, high-impact events -- the ones that wipe out years of savings.",
      whyItHappened: "Insurance costs feel like waste until the moment they are not.",
      counterfactual: "A $15/month renter's policy costs $180/year. A single uninsured theft or fire event can cost $5,000-$15,000.",
      ruleOfThumb: "Insure against things you could not afford to replace. Self-insure only on things you could pay out-of-pocket easily.",
    },
    rightEffects: [
      {
        triggerMonthOffset: 7,
        label: "Uninsured incident. Absorbing the full cost.",
        debtAdd: { kind: "medical", balance: 2800, apr: 0.0 },
        stressDelta: 20,
      },
    ],
  };
}

function retirementContributionEvent(monthIndex: number, age: number): EventCard {
  const earlyAge = age < 30;
  return {
    id: `retirement:${monthIndex}`,
    tag: "retirement",
    title: earlyAge ? "Your 401(k) enrollment window opens" : "Increase retirement contribution?",
    description: earlyAge
      ? "Your employer offers a 401(k) with a 50% match up to 6% of salary. Not using the match is leaving money on the table."
      : "Bumping your retirement contribution by 2% reduces take-home pay but significantly increases long-run wealth.",
    crisis: false,
    left: {
      id: "left",
      title: earlyAge ? "Enroll at 6% (capture full match)" : "Increase by 2%",
      bullets: [
        earlyAge ? "Employer match is a 50% instant return" : "2% more now = years less work later",
        "Pre-tax contribution reduces taxable income",
        "Compounding over decades is the most powerful force here",
      ],
    },
    right: {
      id: "right",
      title: "Skip / keep contribution flat",
      bullets: [
        "Higher take-home pay now",
        earlyAge ? "Missing the match is forfeiting free money" : "Flexibility to allocate elsewhere",
        "Harder to increase later due to lifestyle inflation",
      ],
    },
    debrief: {
      principle: "Employer match is a 50-100% instant guaranteed return -- always capture it first.",
      whyItHappened: earlyAge
        ? "Early career is when contribution habits form. Compounding needs decades to work."
        : "Each 1% increase in contribution rate can reduce required working years by 1-2 years.",
      counterfactual: earlyAge
        ? "Contributing $2,400/year (6% of $40k) with a 50% match at 7% returns grows to ~$680k by age 65."
        : "Increasing contributions by 2% now saves ~3.5 years of work over a 30-year career.",
      ruleOfThumb: "Maximize employer match before anything else. It is the only guaranteed return in investing.",
    },
    leftEffects: [
      { triggerMonthOffset: 0, label: "Retirement contribution increased. Tax bill slightly reduced.", cashDelta: -80 },
      { triggerMonthOffset: 12, label: "First year of retirement compounding underway. Growing silently.", stressDelta: -3 },
    ],
  };
}

function behavioralTemptationEvent(monthIndex: number): EventCard {
  return {
    id: `behavioral:${monthIndex}`,
    tag: "behavioral",
    title: "Social comparison is expensive",
    description: "Your social circle upgraded their lifestyle -- new cars, vacations, renovations. The pressure to keep up is subtle but real.",
    crisis: false,
    left: {
      id: "left",
      title: "Hold your plan, ignore the signal",
      bullets: [
        "Your net worth compounds quietly",
        "Others' spending is often financed invisibly",
        "The wealth gap widens in your favor",
      ],
    },
    right: {
      id: "right",
      title: "Match the lifestyle (you deserve it too)",
      bullets: [
        "Short-term satisfaction is real",
        "Lifestyle inflation is very hard to reverse",
        "Hedonic adaptation means the boost fades quickly",
      ],
    },
    debrief: {
      principle: "Lifestyle inflation is the silent killer of wealth -- income rises but savings rate stays flat or falls.",
      whyItHappened: "Social comparison triggers spending that feels rational in the moment but undermines long-term goals.",
      counterfactual: "The car your neighbor bought on credit costs ~$600/month. That same $600/month invested at 7% is $1.02M over 30 years.",
      ruleOfThumb: "When tempted to match others: ask if you know their balance sheet. Most wealth is hidden in both directions.",
    },
    rightEffects: [
      { triggerMonthOffset: 0, label: "Lifestyle upgrade locked in. New baseline expenses higher.", expenseMultiplier: 1.06 },
      { triggerMonthOffset: 3, label: "The hedonic boost faded. Expenses are still elevated.", stressDelta: 5 },
    ],
  };
}

function taxPlanningEvent(monthIndex: number): EventCard {
  return {
    id: `tax:${monthIndex}`,
    tag: "tax",
    title: "Tax optimization window",
    description: "You could max out your HSA if on a high-deductible plan, harvest a capital loss, or move money to a Roth. Small tax moves compound significantly.",
    crisis: false,
    left: {
      id: "left",
      title: "Take the tax-advantaged action",
      bullets: [
        "HSA is triple-tax advantaged",
        "Roth contributions grow tax-free forever",
        "Tax harvesting is a guaranteed after-tax return",
      ],
    },
    right: {
      id: "right",
      title: "Skip it -- taxes are complex",
      bullets: [
        "No action required",
        "Missed tax alpha is invisible until retirement",
        "Compounding cost is years away",
      ],
    },
    debrief: {
      principle: "Tax-advantaged accounts are the highest guaranteed return available -- better than any investment pick.",
      whyItHappened: "Tax decisions are time-sensitive and easy to defer. Deferring them is itself a costly decision.",
      counterfactual: "Maxing an HSA ($4,150/year) saves ~$1,000 in taxes annually at a 24% bracket -- $20,000+ difference over 20 years.",
      ruleOfThumb: "Order: 401k to match, then HSA, then Roth IRA, then taxable. Never skip a step before filling the one before it.",
    },
    leftEffects: [
      { triggerMonthOffset: 0, label: "Tax move made. After-tax income effectively increased.", cashDelta: 220 },
    ],
  };
}

function founderEquityEvent(monthIndex: number): EventCard {
  return {
    id: `equity:${monthIndex}`,
    tag: "investing",
    title: "Your equity is diluting -- act or accept?",
    description: "A new funding round is closing. Your equity stake dilutes unless you participate or negotiate protective provisions.",
    crisis: false,
    left: {
      id: "left",
      title: "Negotiate anti-dilution or pro-rata rights",
      bullets: [
        "Protects your equity percentage",
        "Requires capital or strong negotiating leverage",
        "Signals sophistication to investors",
      ],
    },
    right: {
      id: "right",
      title: "Accept dilution -- focus on company growth",
      bullets: [
        "A smaller % of a bigger company can be worth more",
        "Dilution is normal and expected",
        "Upside depends entirely on exit outcome",
      ],
    },
    debrief: {
      principle: "Equity value = (% ownership) x (exit valuation). Dilution lowers %, but a bigger company raises the exit multiple.",
      whyItHappened: "Fundraising dilutes early equity. Founders must decide whether maintaining percentage or velocity matters more.",
      counterfactual: "Going from 0.6% to 0.5% at a $100M exit is a $100k difference. Growth from $20M to $100M valuation is a $400k+ gain on the same stake.",
      ruleOfThumb: "Dilution is not failure. Losing equity to build a larger pie usually beats protecting a small slice of a stagnant one.",
    },
  };
}

function elderCareEvent(monthIndex: number): EventCard {
  return {
    id: `family:elder:${monthIndex}`,
    tag: "family",
    title: "A family member needs financial support",
    description: "An aging parent or family member needs financial help. This is one of the most common and least planned-for financial obligations adults face.",
    crisis: true,
    left: {
      id: "left",
      title: "Help with a clear defined structure",
      bullets: [
        "Defines what you can sustainably give",
        "Protects your own financial stability",
        "Prevents resentment from open-ended commitments",
      ],
    },
    right: {
      id: "right",
      title: "Do whatever it takes (no limits set)",
      bullets: [
        "Full family support in the short term",
        "Can erode your savings and retirement",
        "Open-ended commitments grow silently",
      ],
    },
    debrief: {
      principle: "You cannot help others from an empty vessel. Sustainable support requires defined limits.",
      whyItHappened: "Elder care and family financial support are major, underdiscussed drains on household wealth.",
      counterfactual: "An open-ended $500/month commitment is $6,000/year -- equal to maxing a Roth IRA contribution.",
      ruleOfThumb: "Treat family support like a bill: set a fixed sustainable amount, then communicate it clearly.",
    },
    rightEffects: [
      { triggerMonthOffset: 0, label: "Open-ended financial support ongoing. Monthly expenses increased.", expenseMultiplier: 1.08, stressDelta: 10 },
      { triggerMonthOffset: 6, label: "Open-ended family support straining your retirement contributions.", stressDelta: 8 },
    ],
    leftEffects: [
      { triggerMonthOffset: 0, label: "Structured support agreed. Clear boundary -- manageable long-term.", expenseMultiplier: 1.04, stressDelta: 3 },
    ],
  };
}

function randomShockEvent(monthIndex: number): EventCard {
  const shocks = [
    { title: "Car broke down", description: "Unexpected repair cost. Transportation is a job prerequisite.", tag: "car" as EventTag, cost: 1200 },
    { title: "Apartment flooding -- unexpected damages", description: "Water damage requires repairs. Insurance coverage determines the real cost.", tag: "housing" as EventTag, cost: 2200 },
    { title: "Laptop failure -- critical equipment", description: "Your primary work tool died. Replacement is non-negotiable.", tag: "shock" as EventTag, cost: 900 },
  ];
  const shock = shocks[monthIndex % shocks.length];
  return {
    id: `shock:${monthIndex}`,
    tag: shock.tag,
    title: shock.title,
    description: shock.description,
    crisis: true,
    left: {
      id: "left",
      title: "Pay from emergency fund",
      bullets: [
        "Avoids interest and debt",
        "Emergency fund depleted -- rebuild immediately",
        "That is exactly what it is for",
      ],
    },
    right: {
      id: "right",
      title: "Finance it / put on credit",
      bullets: [
        `$${shock.cost} at 22%+ APR grows quickly`,
        "Cash preserved short-term",
        "Stress persists while balance exists",
      ],
    },
    debrief: {
      principle: "Shocks are not exceptions -- they are the normal texture of life. The emergency fund is the shock absorber.",
      whyItHappened: "Average households face one $500+ unexpected expense every 4-6 months.",
      counterfactual: `A $3,000 emergency fund means a $${shock.cost} shock is an inconvenience. Without it, it is a debt spiral entry point.`,
      ruleOfThumb: "Build 3 months of expenses before investing. Then invest. Then build to 6 months.",
    },
    rightEffects: [
      { triggerMonthOffset: 0, label: "Financed the repair. Interest clock is ticking.", debtAdd: { kind: "credit-card", balance: shock.cost, apr: 0.219 }, stressDelta: 8 },
    ],
    leftEffects: [
      { triggerMonthOffset: 0, label: "Emergency fund absorbed the shock. Rebuild the buffer now.", stressDelta: 5 },
    ],
  };
}

// ─── Multi-factor weighted selection ─────────────────────────────────────────

export function generateEvent({
  rng,
  monthIndex,
  cash,
  creditScore,
  dti,
  stress,
  burnout,
  ageYears,
  grossIncomeAnnual,
  scenarioFlags,
  macro,
}: {
  rng: RNG;
  monthIndex: number;
  cash: number;
  creditScore: number;
  dti: number;
  stress: number;
  burnout: number;
  ageYears: number;
  grossIncomeAnnual: number;
  pendingDelayedEffects: Array<{ triggerMonth: number; label: string }>;
  scenarioFlags: ScenarioEventFlags;
  macro: MacroSnapshot;
}): EventCard {
  const cashTight = cash < 1200;
  const creditThin = creditScore < 660 || scenarioFlags.restrictedCredit;
  const highDti = dti > 0.35;
  const highStress = stress > 60;
  const highBurnout = burnout > 65;
  const macroCrisis = macro.recessionProbAnnual > 0.25 && rng.next() < 0.2;
  const healthRoll = rng.next();
  const layoffRoll = rng.next();

  const earlyGame = monthIndex < 12;
  const midGame = monthIndex >= 12 && monthIndex < 36;
  const lateGame = monthIndex >= 36;

  type WeightedCard = { card: EventCard; weight: number };
  const pool: WeightedCard[] = [];
  const push = (card: EventCard, w: number) => pool.push({ card, weight: w });

  push(budgetSurplusEvent(monthIndex, cashTight), cashTight ? 3.5 : 1.5);
  push(investingPatience(monthIndex, macroCrisis), macroCrisis ? 3.0 : 1.2);

  if (creditThin) push(creditLineEvent(monthIndex, scenarioFlags.restrictedCredit), 2.5);
  if (highDti) push(dtiCrisisEvent(monthIndex), 3.5);

  if (scenarioFlags.childcareMonthly > 0 || scenarioFlags.remittanceMonthly > 0)
    push(obligationsEvent(monthIndex, cashTight), cashTight ? 3.0 : 1.8);

  // healthcareRiskAnnual now drives event frequency (fix #2)
  const healthcareMonthlyProb = scenarioFlags.healthcareRiskAnnual / 12;
  if (healthRoll < healthcareMonthlyProb * 1.5) {
    const severe = healthRoll < healthcareMonthlyProb * 0.4;
    push(healthcareShockEvent(monthIndex, severe, scenarioFlags.healthcareRiskAnnual), severe ? 4.0 : 2.0);
  }

  if (midGame || lateGame)
    push(careerOpportunityEvent(monthIndex, grossIncomeAnnual), highBurnout ? 1.0 : 2.0);

  // layoffProbAnnual now drives event frequency (fix #2)
  if (macroCrisis && layoffRoll < (scenarioFlags.layoffProbAnnual / 12) * 2.5)
    push(jobLossEvent(monthIndex, scenarioFlags.layoffProbAnnual), 4.5);

  if (midGame || lateGame) push(housingRentVsBuyEvent(monthIndex, creditScore, cash), 1.2);
  if (earlyGame || rng.next() < 0.15) push(insuranceGapEvent(monthIndex), 1.5);

  if (earlyGame) push(retirementContributionEvent(monthIndex, ageYears), 2.5);
  else if (midGame) push(retirementContributionEvent(monthIndex, ageYears), 1.2);

  push(behavioralTemptationEvent(monthIndex), highStress || highBurnout ? 2.0 : 1.0);

  if (monthIndex % 4 === 0) push(taxPlanningEvent(monthIndex), 1.5);

  // hasEquity (founder scenario) now drives events (fix #2)
  if (scenarioFlags.hasEquity && (midGame || lateGame)) push(founderEquityEvent(monthIndex), 2.5);

  if (midGame) push(elderCareEvent(monthIndex), 0.8);
  if (lateGame) push(elderCareEvent(monthIndex), 1.5);

  push(randomShockEvent(monthIndex), cashTight ? 2.5 : 1.0);

  const totalWeight = pool.reduce((s, x) => s + x.weight, 0);
  let roll = rng.next() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.card;
  }
  return pool[pool.length - 1].card;
}