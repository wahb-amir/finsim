/**
 * Game session lifecycle (server-authoritative simulation).
 *
 *   POST /api/game/session              → create session + initial event
 *   POST /api/game/session/round        → apply choice, return next event
 *   POST /api/game/session/:id/abandon  → exit without deleting history
 *   GET  /api/game/session/:id          → session + current game view
 *   GET  /api/game/session/:id/debrief  → debrief payload (lazy-generates)
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
  getVisibleMetrics,
} = require("../services/simulation");
const {
  normalizeChoice,
  buildOptimalComparisonFromRounds,
  buildFinalMetrics,
  toPublicSession,
  generateAndPersistDebrief,
  toDebriefUIPayload,
  finalMetricsToUI,
} = require("../services/debrief");

function persistGameView(session, stepResult) {
  session.simState = stepResult.state;
  session.currentEvent = stepResult.event;
  session.currentNarrative = stepResult.narrative;
  session.scenarioId = stepResult.state.scenarioId;
  session.simSeed = stepResult.state.seed;
}

function choiceToSide(choice) {
  if (choice === "A" || choice === "left") return "left";
  if (choice === "B" || choice === "right") return "right";
  return choice;
}

function getSelectedOption(event, side) {
  const option = side === "left" ? event?.left : event?.right;
  if (!option) return { title: "", description: "" };
  const description = Array.isArray(option.bullets)
    ? option.bullets.join(" · ")
    : option.description || "";
  return { title: option.title || "", description };
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
    if (!["left", "right", "A", "B"].includes(choice)) {
      return res.status(400).json({ message: 'choice must be "left", "right", "A", or "B"' });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }
    if (session.status === "abandoned") {
      return res.status(400).json({ message: "Session was abandoned — start a new game" });
    }
    if (!session.simState || !session.currentEvent) {
      return res.status(400).json({ message: "Session has no active simulation state" });
    }

    const round = session.currentRound;
    const alreadySubmitted = session.rounds.find((r) => r.round === round);
    if (alreadySubmitted) {
      return res.status(400).json({ message: `Round ${round} already submitted` });
    }

    const eventBefore = session.currentEvent;
    const side = choiceToSide(choice);
    const metricsBefore = toStoredMetrics(
      getVisibleMetrics(session.simState),
      session.simState,
    );
    const selected = getSelectedOption(eventBefore, side);

    const result = applyChoice({ state: session.simState, choice: side });

    session.rounds.push({
      round,
      eventId: eventBefore.id,
      eventTitle: eventBefore.title,
      eventDescription: eventBefore.description,
      choice: normalizeChoice(side),
      selectedOptionTitle: selected.title,
      selectedOptionDescription: selected.description,
      metricsBefore,
      metricsAfter: toStoredMetrics(result.metrics, result.state),
      narrative: result.narrative
        ? {
            headline: result.narrative.headline,
            advisorHint: result.narrative.advisorHint,
          }
        : undefined,
      timestamp: new Date(),
    });

    persistGameView(session, result);
    session.currentRound = Math.min(round + 1, TOTAL_ROUNDS + 1);

    if (round >= TOTAL_ROUNDS) {
      const finalStored = toStoredMetrics(result.metrics, result.state);
      session.finalMetrics = buildFinalMetrics(finalStored, result.state);
      session.finalSalary = result.state.grossIncomeAnnual;
      session.optimalComparison = buildOptimalComparisonFromRounds(session.rounds);
      session.status = "completed";
      session.currentEvent = null;
      session.currentNarrative = null;
    }

    await session.save();

    const metrics = toUIMetrics(result.metrics, result.state);
    const completed = session.status === "completed";

    res.status(200).json({
      success: true,
      currentRound: session.currentRound,
      metrics,
      event: completed ? null : result.event,
      narrative: result.narrative,
      debrief: result.debrief || null,
      status: session.status,
      completed,
      sessionId: session._id,
      ageYears: result.state.ageYears,
      scenarioId: session.scenarioId,
    });
  } catch (err) {
    console.error("[submitRound]", err.message);
    res.status(500).json({ message: "Failed to submit round", error: err.message });
  }
};

const abandonSession = async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "completed") {
      return res.status(400).json({ message: "Cannot abandon a completed session" });
    }

    if (session.status !== "abandoned") {
      session.status = "abandoned";
      await session.save();
    }

    res.status(200).json({
      success: true,
      sessionId: session._id,
      status: session.status,
      message: "Session saved. You can resume from your profile later or start a new game.",
    });
  } catch (err) {
    console.error("[abandonSession]", err.message);
    res.status(500).json({ message: "Failed to abandon session", error: err.message });
  }
};

const getSessionDebrief = async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "completed") {
      return res.status(400).json({
        message: "Debrief is only available for completed sessions",
        status: session.status,
      });
    }

    const { cached } = await generateAndPersistDebrief(session);
    const payload = toDebriefUIPayload(session);
    const metrics = finalMetricsToUI(session.finalMetrics, session.simState);

    res.status(200).json({
      success: true,
      cached,
      debrief: payload,
      metrics,
      session: toPublicSession(session),
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("[getSessionDebrief]", err.message);
    res.status(status).json({
      message: err.statusCode === 400 ? err.message : "Debrief generation failed",
      error: err.message,
    });
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
      session: toPublicSession(session),
      ...(game
        ? {
            currentRound: game.currentRound,
            metrics: game.metrics,
            event: game.event,
            narrative: game.narrative,
            scenarioId: game.scenarioId,
            ageYears: game.ageYears,
            status: session.status,
          }
        : { status: session.status }),
    });
  } catch (err) {
    console.error("[getSession]", err.message);
    res.status(500).json({ message: "Failed to get session", error: err.message });
  }
};

const listSessions = async (req, res) => {
  try {
    const sessions = await GameSession.find({ userId: req.user._id })
      .select(
        "_id career goal status currentRound createdAt finalMetrics.netWorth scenarioId playerName",
      )
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("[listSessions]", err.message);
    res.status(500).json({ message: "Failed to list sessions", error: err.message });
  }
};

module.exports = {
  createSession,
  submitRound,
  abandonSession,
  getSessionDebrief,
  getSession,
  listSessions,
};
