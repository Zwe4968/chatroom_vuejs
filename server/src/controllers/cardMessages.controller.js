const CardMessage = require("../models/CardMessage");

function toCardMessageJSON(doc) {
  return {
    id: doc._id.toString(),
    cardId: doc.cardId.toString(),
    message: doc.message,
    name: doc.name,
    userid: doc.userId.toString(),
    avatarUrl: doc.avatarUrl,
    created_at: doc.createdAt.toISOString(),
  };
}

async function list(req, res) {
  const messages = await CardMessage.find({ cardId: req.params.cardId }).sort({ createdAt: 1 });
  res.json(messages.map(toCardMessageJSON));
}

module.exports = { list, toCardMessageJSON };
