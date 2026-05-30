const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createSession,
  submitRound,
  abandonSession,
  getSessionDebrief,
  getSession,
  listSessions,
  userData
} = require("../controller/game");

// POST /api/game/session          — start a new game session
router.post("/session",            authMiddleware, createSession);

// POST /api/game/session/round    — submit a round choice
router.post("/session/round",      authMiddleware, submitRound);

// POST /api/game/session/:id/abandon — exit game; preserves session data
router.post("/session/:id/abandon", authMiddleware, abandonSession);

// GET  /api/game/session/:id/debrief — lazy-generate + return debrief payload
router.get("/session/:id/debrief", authMiddleware, getSessionDebrief);

// GET  /api/game/session/:id      — get session by id
router.get("/session/:id",         authMiddleware, getSession);

// GET  /api/game/sessions         — list user's past sessions
router.get("/sessions",            authMiddleware, listSessions);

router.get("/sessions/userData",            authMiddleware, userData);

module.exports = router;