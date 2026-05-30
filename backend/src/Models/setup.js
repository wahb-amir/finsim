const mongoose = require("mongoose");

const setupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  confidence: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Setup", setupSchema);
