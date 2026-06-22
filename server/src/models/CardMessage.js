const mongoose = require("mongoose");

const cardMessageSchema = new mongoose.Schema({
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  message: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  avatarUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

cardMessageSchema.index({ cardId: 1, createdAt: 1 });

module.exports = mongoose.model("CardMessage", cardMessageSchema);
