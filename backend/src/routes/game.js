const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { createSession, submitRound, getSession, listSessions } = require("../controller/game");

// POST /api/game/session          — start a new game session
router.post("/session",            authMiddleware, createSession);

// POST /api/game/session/round    — submit a round choice
router.post("/session/round",      authMiddleware, submitRound);

// GET  /api/game/session/:id      — get session by id
router.get("/session/:id",         authMiddleware, getSession);

// GET  /api/game/sessions         — list user's past sessions
router.get("/sessions",            authMiddleware, listSessions);

module.exports = router;