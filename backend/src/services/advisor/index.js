/**
 * In-game advisor context — built entirely from server state.
 * Never accepts player-controlled retrieval inputs.
 */

const GameSession = require("../../Models/GameSession");
const Onboarding = require("../../Models/Onboarding");
const { getVisibleMetrics } = require("../simulation/engine");
const { toStoredMetrics } = require("../simulation/metrics");
const { normalizeChoice, OPTIMAL_CHOICES } = require("../debrief");

const MAX_ADVISOR_CALLS = 4;

const BEHAVIORAL_PATTERNS = {
  1: "present_bias",
  2: "availability_heuristic",
  3: "lifestyle_inflation",
  4: "loss_aversion",
  5: "availability_heuristic",
  6: "present_bias",
  7: "loss_aversion",
  8: "present_bias",
  9: "present_bias",
  10: "mental_accounting",
};

const PATTERN_LABELS = {
  present_bias: "present bias",
  availability_heuristic: "availability heuristic",
  lifestyle_inflation: "lifestyle inflation",
  loss_aversion: "loss aversion",
  mental_accounting: "mental accounting",
};

function mode(arr) {
  if (!arr.length) return null;
  const freq = arr.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function formatOption(option) {
  if (!option) return "N/A";
  const bullets = Array.isArray(option.bullets)
    ? option.bullets.join(" · ")
    : option.description || "";
  return bullets ? `${option.title}: ${bullets}` : option.title || "N/A";
}

function buildChoiceContext(event) {
  if (!event) return null;
  return {
    title: event.title || "Current decision",
    description: event.description || "",
    optionA: formatOption(event.left),
    optionB: formatOption(event.right),
  };
}

function buildSessionMetrics(session) {
  const visible = getVisibleMetrics(session.simState);
  const metrics = toStoredMetrics(visible, session.simState);
  metrics.careerLabel = session.career || null;
  metrics.goal = session.goal || null;
  metrics.climateLabel = session.climateLabel || null;
  return metrics;
}

function buildCurrentMistakes(rounds) {
  return (rounds || [])
    .filter((r) => normalizeChoice(r.choice) !== OPTIMAL_CHOICES[r.round])
    .map((r) => ({
      round: r.round,
      title: r.eventTitle || `Round ${r.round}`,
      choiceMade: normalizeChoice(r.choice),
      optimalChoice: OPTIMAL_CHOICES[r.round],
      pattern: BEHAVIORAL_PATTERNS[r.round] || null,
      patternLabel: PATTERN_LABELS[BEHAVIORAL_PATTERNS[r.round]] || null,
    }));
}

function buildAdvisorQuery(round, metrics, choiceContext, mistakes) {
  const parts = [`Round ${round}: ${choiceContext.title}`];

  if (metrics.creditCardDebt > 0) parts.push("credit card debt compounding");
  if ((metrics.emergencyFundMonths ?? 0) < 3)
    parts.push("insufficient emergency fund");
  if ((metrics.debtToIncome ?? 0) > 36) parts.push("high debt-to-income ratio");
  if ((metrics.stressIndex ?? 0) > 65) parts.push("high financial stress");
  if (!metrics.is401kActive) parts.push("employer 401k match");
  if ((metrics.investmentBalance ?? 0) === 0)
    parts.push("no investment portfolio");
  if (metrics.creditScore && metrics.creditScore < 660)
    parts.push("low credit score");

  if (mistakes.length) {
    const patterns = [
      ...new Set(mistakes.map((m) => m.pattern).filter(Boolean)),
    ];
    if (patterns.length)
      parts.push(`behavioral patterns: ${patterns.join(", ")}`);
  }

  parts.push(`career: ${metrics.careerLabel || "general"}`);
  if (metrics.goal) parts.push(`goal: ${metrics.goal}`);
  return parts.join(". ");
}

async function fetchUserAdvisorProfile(userId, currentSessionId) {
  const [onboarding, pastSessions] = await Promise.all([
    Onboarding.findOne({ userId, completed: true })
      .select("financialProfile")
      .lean(),
    GameSession.find({
      userId,
      status: "completed",
      _id: { $ne: currentSessionId },
    })
      .select(
        "rounds debriefData.headline.score debriefData.headline.scoreLabel career goal",
      )
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  const pastMistakePatterns = [];
  for (const session of pastSessions) {
    for (const round of session.rounds || []) {
      if (normalizeChoice(round.choice) !== OPTIMAL_CHOICES[round.round]) {
        pastMistakePatterns.push(BEHAVIORAL_PATTERNS[round.round]);
      }
    }
  }

  const dominantPastPattern = mode(pastMistakePatterns.filter(Boolean));
  const recentScores = pastSessions
    .map((s) => s.debriefData?.headline?.score)
    .filter((score) => typeof score === "number");

  return {
    onboarding: onboarding?.financialProfile
      ? {
          archetype: onboarding.financialProfile.archetype,
          confidenceLevel: onboarding.financialProfile.confidenceLevel,
          primaryGoal: onboarding.financialProfile.primaryGoal,
        }
      : null,
    pastGames: {
      gamesCompleted: pastSessions.length,
      dominantPattern: dominantPastPattern,
      dominantPatternLabel: PATTERN_LABELS[dominantPastPattern] || null,
      averageScore:
        recentScores.length > 0
          ? Math.round(
              recentScores.reduce((sum, n) => sum + n, 0) / recentScores.length,
            )
          : null,
      recentScoreLabels: pastSessions
        .map((s) => s.debriefData?.headline?.scoreLabel)
        .filter(Boolean)
        .slice(0, 2),
    },
  };
}

/**
 * Assemble full advisor payload from authoritative session + user records.
 */
async function buildAdvisorContext(session) {
  if (!session.simState || !session.currentEvent) {
    const err = new Error("No active decision available for advisor");
    err.statusCode = 400;
    throw err;
  }

  const round = session.currentRound;
  const metrics = buildSessionMetrics(session);
  const choiceContext = buildChoiceContext(session.currentEvent);
  const currentMistakes = buildCurrentMistakes(session.rounds);
  const userProfile = await fetchUserAdvisorProfile(
    session.userId,
    session._id,
  );
  const query = buildAdvisorQuery(
    round,
    metrics,
    choiceContext,
    currentMistakes,
  );

  return {
    round,
    metrics,
    choiceContext,
    currentMistakes,
    userProfile,
    query,
    career: session.career || null,
  };
}

function getAdvisorRemaining(session) {
  return Math.max(0, MAX_ADVISOR_CALLS - (session.advisorCallsUsed || 0));
}

function canUseAdvisor(session) {
  return (
    session.status === "active" &&
    getAdvisorRemaining(session) > 0 &&
    Boolean(session.currentEvent)
  );
}

module.exports = {
  MAX_ADVISOR_CALLS,
  buildAdvisorContext,
  getAdvisorRemaining,
  canUseAdvisor,
};
