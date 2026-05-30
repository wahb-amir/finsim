const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { debriefController } = require("../controller/debrief");

// POST /api/ai/debrief  — returns full JSON debrief report
router.post("/debrief", authMiddleware, debriefController);

module.exports = router;
