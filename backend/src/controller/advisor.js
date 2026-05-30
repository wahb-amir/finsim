/**
 * In-game advisor — sessionId only; all context from server state.
 */

const GameSession = require("../Models/GameSession");
const { generateAdvisorResponse } = require("../ai/advisor");
const {
  MAX_ADVISOR_CALLS,
  buildAdvisorContext,
  getAdvisorRemaining,
  canUseAdvisor,
} = require("../services/advisor");

const requestAdvisor = async (req, res) => {
  try {
    const sessionId = req.params.id || req.body?.sessionId;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const session = await GameSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }
    if (session.status === "abandoned") {
      return res.status(400).json({ message: "Session was abandoned" });
    }
    if (!canUseAdvisor(session)) {
      const remaining = getAdvisorRemaining(session);
      if (remaining <= 0) {
        return res.status(429).json({
          message: `Advisor limit reached (${MAX_ADVISOR_CALLS} uses per game)`,
          remainingUses: 0,
          advisorCallsUsed: session.advisorCallsUsed || 0,
        });
      }
      return res
        .status(400)
        .json({ message: "No active decision for advisor" });
    }

    const context = await buildAdvisorContext(session);
    const { message, sources } = await generateAdvisorResponse(context);

    session.advisorCallsUsed = (session.advisorCallsUsed || 0) + 1;
    session.advisorMessages = session.advisorMessages || [];
    session.advisorMessages.push({
      round: session.currentRound,
      message,
      timestamp: new Date(),
    });
    await session.save();

    const remainingUses = getAdvisorRemaining(session);

    return res.status(200).json({
      success: true,
      message,
      round: session.currentRound,
      remainingUses,
      advisorCallsUsed: session.advisorCallsUsed,
      advisorMessages: session.advisorMessages,
      sources,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("[requestAdvisor]", err.message);
    return res.status(status).json({
      message: status === 400 ? err.message : "Advisor failed",
      error: err.message,
    });
  }
};

module.exports = { requestAdvisor };
