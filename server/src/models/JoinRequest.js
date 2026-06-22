const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

joinRequestSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model("JoinRequest", joinRequestSchema);
