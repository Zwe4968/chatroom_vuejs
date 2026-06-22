const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "admin", "member", "viewer"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  visibility: { type: String, enum: ["private", "public"], default: "private" },
  members: { type: [memberSchema], default: [] },
}, { timestamps: true });

projectSchema.index({ "members.userId": 1 });
projectSchema.index({ visibility: 1 });

module.exports = mongoose.model("Project", projectSchema);
