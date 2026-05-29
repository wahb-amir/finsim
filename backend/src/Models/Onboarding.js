const onboardingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  currentStep: {
    type: Number,
    default: 0,
  },

  answers: {
    type: Object,
    default: {},
  },

  completed: {
    type: Boolean,
    default: false,
  },

  completedAt: Date,
});
