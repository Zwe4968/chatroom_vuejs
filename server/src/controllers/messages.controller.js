const Message = require("../models/Message");

function toMessageJSON(doc) {
  return {
    id: doc._id.toString(),
    message: doc.message,
    name: doc.name,
    userid: doc.userId.toString(),
    avatarUrl: doc.avatarUrl,
    created_at: doc.createdAt.toISOString(),
  };
}

async function list(req, res) {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages.map(toMessageJSON));
}

async function create(req, res) {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ code: "MISSING_MESSAGE", message: "Message text is required." });
  }
  const doc = await Message.create({
    message,
    name: req.user.displayName,
    userId: req.user.id,
    avatarUrl: req.user.avatarUrl,
  });
  res.status(201).json(toMessageJSON(doc));
}

module.exports = { list, create, toMessageJSON };
