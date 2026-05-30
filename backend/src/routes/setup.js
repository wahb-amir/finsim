const express = require("express");
const router = express.Router();
const Setup = require("../Models/setup");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/setup", authMiddleware, async (req, res) => {
  try {
    const { name, confidence, goal } = req.body;

    if (!name || !confidence || !goal) {
      return res
        .status(401)
        .json({ success: false, message: "please fill all fields" });
    }

    const existingSetup = await Setup.findOne({ userId: req.user._id });

    if (existingSetup) {
      return res.status(409).json({
        success: false,
        message: "Setup already exists. Use update instead",
      });
    }

    const newSetup = new Setup({
      userId: req.user._id,
      email: req.user.email,
      name,
      confidence,
      goal,
    });

    await newSetup.save();

    return res
      .status(200)
      .json({ success: true, message: "Setup Created Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/setup", authMiddleware, async (req, res) => {
  try {
    const { name, confidence, goal } = req.body;

    if (!name || !confidence || !goal) {
      return res
        .status(401)
        .json({ success: false, message: "please fill all fields" });
    }

    const updatedSetup = await Setup.findOneAndUpdate(
      { userId: req.user._id },
      {
        name,
        confidence,
        goal,
        email: req.user.email,
      },
      { new: true },
    );

    if (!updatedSetup) {
      return res
        .status(404)
        .json({ success: false, message: "Setup not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Setup Updated Successfully",
      setup: updatedSetup,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
