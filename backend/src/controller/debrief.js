/**
 * src/controllers/debrief.js
 */

const GameSession = require("../Models/GameSession");
const { generateDebriefReport } = require("../ai/debrief");

const debriefController = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

    const session = await GameSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Must be a completed 10-round game
    if (session.rounds.length < 10) {
      return res.status(400).json({ message: "Game must be completed before generating debrief" });
    }

    // Return cached report if it exists — debrief is never re-generated
    if (session.debriefReport) {
      return res.status(200).json({ success: true, cached: true, report: session.debriefReport });
    }

    // Generate
    const report = await generateDebriefReport(session);

    // Persist to session so we never regenerate
    session.debriefReport = report;
    session.status = "completed";
    await session.save();

    return res.status(200).json({ success: true, cached: false, report });
  } catch (err) {
    console.error("[debriefController]", err.message);
    res.status(500).json({ message: "Debrief generation failed", error: err.message });
  }
};

module.exports = { debriefController };