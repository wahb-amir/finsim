import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    financialProfile: {
      archetype: {
        type: String,
        enum: ["variable-income", "lifestyle-creep", "paycheck-to-paycheck"],
        required: function () {
          return this.completed; 
        },
      },
      confidenceLevel: {
        type: Number,
        min: 1,
        max: 5,
        required: function () {
          return this.completed;
        },
      },
      primaryGoal: {
        type: String,
        enum: ["avoid-debt", "build-wealth", "understand-basics"],
        required: function () {
          return this.completed;
        },
      },
    },

    // Funnel & State Tracking
    currentStep: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);

// Pre-save hook to automatically manage the completedAt timestamp
onboardingSchema.pre("save", function (next) {
  if (this.isModified("completed") && this.completed) {
    this.completedAt = new Date();
  }
  next();
});

const Onboarding = mongoose.models.Onboarding || mongoose.model("Onboarding", onboardingSchema);
export default Onboarding;