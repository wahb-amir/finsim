/**
 * src/controllers/advisor.js
 */

const GameSession = require("../Models/GameSession");
const { streamAdvisorResponse } = require("../ai/advisor");

const advisorController = async (req, res) => {
  try {
    const { sessionId, round, metrics, choiceContext } = req.body;

    // Validate required fields
    if (!sessionId || !round || !metrics || !choiceContext) {
      return res.status(400).json({ message: "sessionId, round, metrics, and choiceContext are required" });
    }

    // Verify session belongs to this user
    const session = await GameSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "completed") return res.status(400).json({ message: "Game already completed" });

    // Merge DB career into metrics so retriever can filter by it
    metrics.careerLabel = metrics.careerLabel || session.career;

    await streamAdvisorResponse({ round, metrics, choiceContext }, res);
  } catch (err) {
    console.error("[advisorController]", err.message);
    // If SSE headers already sent, close stream with error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ message: "Advisor failed", error: err.message });
    }
  }
};

module.exports = { advisorController };