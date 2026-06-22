const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "project_updated",
      "project_visibility_changed",
      "member_added",
      "member_removed",
      "member_role_changed",
      "card_created",
      "card_status_changed",
      "card_assigned",
      "card_chat_message",
      "join_requested",
      "join_request_approved",
      "join_request_denied",
    ],
    required: true,
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card", default: null },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
