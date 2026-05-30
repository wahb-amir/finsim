const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  round:        { type: Number, required: true },
  title:        { type: String },
  eventId:      { type: String },
  choice:       { type: String, enum: ["left", "right"], required: true },
  metricsAfter: {
    netWorth:            Number,
    creditScore:         Number,
    savingsBalance:      Number,
    investmentBalance:   Number,
    retirementBalance:   Number,
    totalDebt:           Number,
    emergencyFundMonths: Number,
    monthlySurplus:      Number,
    stressIndex:         Number,
    debtToIncome:        Number,
    is401kActive:        Boolean,
    creditCardDebt:      Number,
    salary:              Number,
  },
}, { _id: false });

const gameSessionSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  playerName:    { type: String },
  career:        { type: String },
  startSalary:   { type: Number },
  finalSalary:   { type: Number },
  goal:          { type: String },
  climateLabel:  { type: String },
  currentRound:  { type: Number, default: 1 },
  status:        { type: String, enum: ["active", "completed"], default: "active" },
  rounds:        [roundSchema],

  scenarioId:      { type: String },
  simSeed:         { type: Number },
  simulationState: { type: mongoose.Schema.Types.Mixed, default: null },
  currentEvent:    { type: mongoose.Schema.Types.Mixed, default: null },
  currentNarrative:{ type: mongoose.Schema.Types.Mixed, default: null },

  finalMetrics: {
    netWorth:            Number,
    creditScore:         Number,
    savingsBalance:      Number,
    investmentBalance:   Number,
    retirementBalance:   Number,
    totalDebt:           Number,
    totalInterestPaid:   Number,
    stressIndex:         Number,
  },

  optimalComparison: {
    optimalNetWorth:    Number,
    optimalCredit:      Number,
    optimalRetirement:  Number,
  },

  debriefReport: { type: mongoose.Schema.Types.Mixed, default: null },

}, { timestamps: true });

module.exports = mongoose.model("GameSession", gameSessionSchema);
