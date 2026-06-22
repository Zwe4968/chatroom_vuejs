const User = require("../models/User");

function toUserSummaryJSON(doc) {
  return {
    id: doc._id.toString(),
    displayName: doc.displayName,
    email: doc.email,
    avatarUrl: doc.avatarUrl,
  };
}

async function search(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json([]);
  }
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [{ displayName: regex }, { email: regex }],
  }).limit(10);
  res.json(users.map(toUserSummaryJSON));
}

module.exports = { search, toUserSummaryJSON };
