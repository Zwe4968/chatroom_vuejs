const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "group"], required: true },
  name: { type: String, default: null },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastReadAt: { type: Date, default: null },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ "participants.userId": 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
