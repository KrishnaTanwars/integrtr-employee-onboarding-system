import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
  },

  name: String,
  email: {
    type: String,
    required: true,
  },
  department: String,

  sfEmployeeId: String,

  sfStatus: {
    type: String,
    default: "PENDING",
  },

  slackTeamStatus: {
    type: String,
    default: "PENDING",
  },

  slackHrStatus: {
    type: String,
    default: "PENDING",
  },

  status: {
    type: String,
    default: "PENDING",
  },

  failedStep: String,

  createdBy: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Onboarding", onboardingSchema);