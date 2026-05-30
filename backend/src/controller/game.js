/**
 * src/controllers/game.js
 *
 * Handles game session lifecycle:
 *   POST /api/game/session         → create new session
 *   POST /api/game/session/round   → submit a round choice + update metrics
 *   GET  /api/game/session/:id     → get session state
 */

const GameSession = require("../Models/GameSession");

// ── Create session ────────────────────────────────────────────────────────────

const createSession = async (req, res) => {
  try {
    const { playerName, career, startSalary, goal, climateLabel } = req.body;

    if (!career || !startSalary) {
      return res.status(400).json({ message: "career and startSalary are required" });
    }

    const session = await GameSession.create({
      userId:      req.user._id,
      playerName:  playerName || req.user.name || "Player",
      career,
      startSalary,
      goal:        goal        || "Build wealth",
      climateLabel: climateLabel || "Stable",
      currentRound: 1,
      status:      "active",
      rounds:      [],
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
    const { sessionId, round, title, choice, metricsAfter } = req.body;

    if (!sessionId || !round || !choice || !metricsAfter) {
      return res.status(400).json({ message: "sessionId, round, choice, and metricsAfter are required" });
    }
    if (!["A", "B"].includes(choice)) {
      return res.status(400).json({ message: "choice must be A or B" });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session)                      return res.status(404).json({ message: "Session not found" });
    if (session.status === "completed") return res.status(400).json({ message: "Game already completed" });

    // Prevent duplicate round submissions
    const alreadySubmitted = session.rounds.find((r) => r.round === round);
    if (alreadySubmitted) return res.status(400).json({ message: `Round ${round} already submitted` });

    // Append round
    session.rounds.push({ round, title, choice, metricsAfter });
    session.currentRound = round + 1;

    // If round 10 — freeze final metrics
    if (round === 10) {
      session.finalMetrics  = metricsAfter;
      session.finalSalary   = metricsAfter.salary || session.startSalary;
      // optimalComparison should be sent by the client (computed from game engine)
      if (req.body.optimalComparison) session.optimalComparison = req.body.optimalComparison;
    }

    await session.save();
    res.status(200).json({ success: true, currentRound: session.currentRound, session });
  } catch (err) {
    console.error("[submitRound]", err.message);
    res.status(500).json({ message: "Failed to submit round", error: err.message });
  }
};

// ── Get session ───────────────────────────────────────────────────────────────

const getSession = async (req, res) => {
  try {
    const session = await GameSession.findOne({ _id: req.params.id, userId: req.user._id });
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