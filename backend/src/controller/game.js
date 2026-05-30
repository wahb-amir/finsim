/**
 * Game session lifecycle (server-authoritative simulation).
 *
 *   POST /api/game/session         → create session + initial event
 *   POST /api/game/session/round   → apply choice, return next event
 *   GET  /api/game/session/:id     → session + current game view
 */

const GameSession = require("../Models/GameSession");
const {
  createNewGame,
  applyChoice,
  TOTAL_ROUNDS,
  toUIMetrics,
  toStoredMetrics,
  deriveScenarioId,
  hashStringToSeed,
  buildGameView,
} = require("../services/simulation");

function persistGameView(session, stepResult) {
  session.simulationState = stepResult.state;
  session.currentEvent = stepResult.event;
  session.currentNarrative = stepResult.narrative;
  session.scenarioId = stepResult.state.scenarioId;
  session.simSeed = stepResult.state.seed;
}

const createSession = async (req, res) => {
  try {
    const { playerName, career, startSalary, goal, climateLabel } = req.body;

    if (!career || !startSalary) {
      return res.status(400).json({ message: "career and startSalary are required" });
    }

    const session = await GameSession.create({
      userId: req.user._id,
      playerName: playerName || req.user.name || "Player",
      career,
      startSalary,
      goal: goal || "build-wealth",
      climateLabel: climateLabel || "Stable",
      currentRound: 1,
      status: "active",
      rounds: [],
    });

    const scenarioId = deriveScenarioId(session);
    const seed = hashStringToSeed(String(session._id));
    const step = createNewGame({ scenarioId, seed });

    persistGameView(session, step);
    session.scenarioId = scenarioId;
    session.simSeed = seed;
    await session.save();

    const metrics = toUIMetrics(step.metrics, step.state);

    res.status(201).json({
      success: true,
      sessionId: session._id,
      currentRound: session.currentRound,
      metrics,
      event: step.event,
      narrative: step.narrative,
      scenarioId,
      ageYears: step.state.ageYears,
    });
  } catch (err) {
    console.error("[createSession]", err.message);
    res.status(500).json({ message: "Failed to create session", error: err.message });
  }
};

const submitRound = async (req, res) => {
  try {
    const { sessionId, choice } = req.body;

    if (!sessionId || !choice) {
      return res.status(400).json({ message: "sessionId and choice are required" });
    }
    if (!["left", "right"].includes(choice)) {
      return res.status(400).json({ message: 'choice must be "left" or "right"' });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }
    if (!session.simulationState || !session.currentEvent) {
      return res.status(400).json({ message: "Session has no active simulation state" });
    }

    const round = session.currentRound;
    const alreadySubmitted = session.rounds.find((r) => r.round === round);
    if (alreadySubmitted) {
      return res.status(400).json({ message: `Round ${round} already submitted` });
    }

    const eventBefore = session.currentEvent;
    const result = applyChoice({ state: session.simulationState, choice });

    session.rounds.push({
      round,
      title: eventBefore.title,
      eventId: eventBefore.id,
      choice,
      metricsAfter: toStoredMetrics(result.metrics, result.state),
    });

    persistGameView(session, result);
    session.currentRound = Math.min(round + 1, TOTAL_ROUNDS + 1);

    if (round >= TOTAL_ROUNDS) {
      const finalStored = toStoredMetrics(result.metrics, result.state);
      session.finalMetrics = {
        netWorth: finalStored.netWorth,
        creditScore: finalStored.creditScore,
        savingsBalance: finalStored.savingsBalance,
        investmentBalance: finalStored.investmentBalance,
        retirementBalance: finalStored.retirementBalance,
        totalDebt: finalStored.totalDebt,
        stressIndex: finalStored.stressIndex,
      };
      session.finalSalary = result.state.grossIncomeAnnual;
      session.status = "completed";
    }

    await session.save();

    const metrics = toUIMetrics(result.metrics, result.state);

    res.status(200).json({
      success: true,
      currentRound: session.currentRound,
      metrics,
      event: session.status === "completed" ? null : result.event,
      narrative: result.narrative,
      debrief: result.debrief || null,
      status: session.status,
      completed: session.status === "completed",
      ageYears: result.state.ageYears,
      scenarioId: session.scenarioId,
    });
  } catch (err) {
    console.error("[submitRound]", err.message);
    res.status(500).json({ message: "Failed to submit round", error: err.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const game = buildGameView(session);

    res.status(200).json({
      success: true,
      session,
      ...(game
        ? {
            currentRound: game.currentRound,
            metrics: game.metrics,
            event: game.event,
            narrative: game.narrative,
            scenarioId: game.scenarioId,
            ageYears: game.ageYears,
          }
        : {}),
    });
  } catch (err) {
    console.error("[getSession]", err.message);
    res.status(500).json({ message: "Failed to get session", error: err.message });
  }
};

const listSessions = async (req, res) => {
  try {
    const sessions = await GameSession.find({ userId: req.user._id })
      .select("_id career goal status currentRound createdAt finalMetrics.netWorth scenarioId")
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("[listSessions]", err.message);
    res.status(500).json({ message: "Failed to list sessions", error: err.message });
  }
};

module.exports = { createSession, submitRound, getSession, listSessions };
