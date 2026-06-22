const mongoose = require("mongoose");

const conversationMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  message: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  avatarUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

conversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("ConversationMessage", conversationMessageSchema);
