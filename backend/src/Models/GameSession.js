/**
 * src/controllers/game.js
 *
 * Handles game session lifecycle:
 *   POST /api/game/session         → create new session
 *   POST /api/game/session/round   → submit a round choice + update metrics
 *   GET  /api/game/session/:id     → get session state
 */

const GameSession = require("../Models/GameSession");

const MAX_ROUNDS = 10;

// ── Create session ────────────────────────────────────────────────────────────

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
      goal: goal || "Build wealth",
      climateLabel: climateLabel || "Stable",
      currentRound: 1,
      status: "active",
      rounds: [],
    });

    res.status(201).json({ success: true, sessionId: session._id, session });
  } catch (err) {
    console.error("[createSession]", err.message);
    res.status(500).json({ message: "Failed to create session", error: err.message });
  }
};

// ── Submit round ──────────────────────────────────────────────────────────────

const submitRound = async (req, res) => {
  try {
    const { sessionId, round, title, choice, metricsAfter, optimalComparison } = req.body;

    const roundNumber = Number(round);

    if (!sessionId || !round || !choice || !metricsAfter) {
      return res.status(400).json({
        message: "sessionId, round, choice, and metricsAfter are required",
      });
    }

    if (!Number.isInteger(roundNumber)) {
      return res.status(400).json({ message: "round must be an integer" });
    }

    if (roundNumber < 1 || roundNumber > MAX_ROUNDS) {
      return res.status(400).json({
        message: `Round must be between 1 and ${MAX_ROUNDS}`,
      });
    }

    if (!["A", "B"].includes(choice)) {
      return res.status(400).json({ message: "choice must be A or B" });
    }

    const session = await GameSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }

    if (roundNumber !== session.currentRound) {
      return res.status(400).json({
        message: `Expected round ${session.currentRound}, received round ${roundNumber}`,
      });
    }

    // Prevent duplicate round submissions
    const alreadySubmitted = session.rounds.find((r) => r.round === roundNumber);
    if (alreadySubmitted) {
      return res.status(400).json({ message: `Round ${roundNumber} already submitted` });
    }

    // Append round
    session.rounds.push({
      round: roundNumber,
      title,
      choice,
      metricsAfter,
    });

    // Freeze final metrics on round 10 and complete the game
    if (roundNumber === MAX_ROUNDS) {
      session.finalMetrics = metricsAfter;
      session.finalSalary = metricsAfter.salary || session.startSalary;
      session.status = "completed";

      if (optimalComparison) {
        session.optimalComparison = optimalComparison;
      }
    } else {
      session.currentRound = roundNumber + 1;
    }

    await session.save();

    res.status(200).json({
      success: true,
      currentRound: session.currentRound,
      status: session.status,
      session,
    });
  } catch (err) {
    console.error("[submitRound]", err.message);
    res.status(500).json({ message: "Failed to submit round", error: err.message });
  }
};

// ── Get session ───────────────────────────────────────────────────────────────

const getSession = async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("[getSession]", err.message);
    res.status(500).json({ message: "Failed to get session", error: err.message });
  }
};

// ── List user sessions ────────────────────────────────────────────────────────

const listSessions = async (req, res) => {
  try {
    const sessions = await GameSession.find({ userId: req.user._id })
      .select("_id career goal status currentRound createdAt finalMetrics.netWorth")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("[listSessions]", err.message);
    res.status(500).json({ message: "Failed to list sessions", error: err.message });
  }
};

module.exports = { createSession, submitRound, getSession, listSessions };