const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  avatarUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
