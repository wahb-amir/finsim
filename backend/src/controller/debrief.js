/**
 * AI debrief endpoint (POST) — delegates to shared debrief service.
 * Prefer GET /api/game/session/:id/debrief for the debrief page.
 */

const GameSession = require("../Models/GameSession");
const {
  generateAndPersistDebrief,
  toDebriefUIPayload,
  finalMetricsToUI,
  toPublicSession,
} = require("../services/debrief");

const debriefController = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ message: "sessionId is required" });

    const session = await GameSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Game must be completed before generating debrief" });
    }

    const hadDebrief = Boolean(session.debriefData);
    const { cached, report, sources } =
      await generateAndPersistDebrief(session);
    const debrief = toDebriefUIPayload(session);
    const metrics = finalMetricsToUI(session.finalMetrics, session.simState);

    return res.status(200).json({
      success: true,
      cached: cached || hadDebrief,
      report,
      debrief,
      metrics,
      sources,
      session: toPublicSession(session),
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("[debriefController]", err.message);
    res.status(status).json({
      message: status === 400 ? err.message : "Debrief generation failed",
      error: err.message,
    });
  }
};

module.exports = { debriefController };
