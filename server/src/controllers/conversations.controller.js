const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");

const POPULATE_PARTICIPANTS = { path: "participants.userId", select: "displayName email avatarUrl" };

function toConversationMessageJSON(doc) {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    message: doc.message,
    name: doc.name,
    userid: doc.userId.toString(),
    avatarUrl: doc.avatarUrl,
    created_at: doc.createdAt.toISOString(),
  };
}

async function toConversationSummaryJSON(doc, viewerUserId) {
  const myParticipant = doc.participants.find((p) => p.userId._id.toString() === viewerUserId);
  const otherParticipants = doc.participants.filter((p) => p.userId._id.toString() !== viewerUserId);
  const name = doc.type === "group" ? doc.name : (otherParticipants[0] ? otherParticipants[0].userId.displayName : "Unknown");

  const lastMessage = await ConversationMessage.findOne({ conversationId: doc._id }).sort({ createdAt: -1 });

  const unreadFilter = { conversationId: doc._id, userId: { $ne: viewerUserId } };
  if (myParticipant && myParticipant.lastReadAt) {
    unreadFilter.createdAt = { $gt: myParticipant.lastReadAt };
  }
  const unreadCount = await ConversationMessage.countDocuments(unreadFilter);

  return {
    id: doc._id.toString(),
    type: doc.type,
    name,
    participants: doc.participants.map((p) => ({
      userId: p.userId._id.toString(),
      displayName: p.userId.displayName,
      avatarUrl: p.userId.avatarUrl,
    })),
    lastMessage: lastMessage ? lastMessage.message : null,
    lastMessageAt: doc.lastMessageAt,
    unreadCount,
  };
}

async function list(req, res) {
  const conversations = await Conversation.find({ "participants.userId": req.user.id })
    .populate(POPULATE_PARTICIPANTS)
    .sort({ lastMessageAt: -1 });
  const results = await Promise.all(conversations.map((c) => toConversationSummaryJSON(c, req.user.id)));
  res.json(results);
}

async function create(req, res) {
  const type = req.body.type === "group" ? "group" : "direct";
  const participantIds = Array.isArray(req.body.participantIds)
    ? [...new Set(req.body.participantIds.map(String))].filter((id) => id !== req.user.id)
    : [];

  if (!participantIds.length) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "At least one other participant is required." });
  }

  if (type === "direct") {
    if (participantIds.length !== 1) {
      return res.status(400).json({ code: "INVALID_PARTICIPANTS", message: "Direct conversations need exactly one other participant." });
    }
    const otherId = participantIds[0];
    const candidates = await Conversation.find({ type: "direct", "participants.userId": { $all: [req.user.id, otherId] } });
    const existing = candidates.find((c) => c.participants.length === 2);
    if (existing) {
      await existing.populate(POPULATE_PARTICIPANTS);
      return res.json(await toConversationSummaryJSON(existing, req.user.id));
    }

    const conversation = await Conversation.create({
      type: "direct",
      participants: [{ userId: req.user.id }, { userId: otherId }],
      createdBy: req.user.id,
    });
    await conversation.populate(POPULATE_PARTICIPANTS);
    return res.status(201).json(await toConversationSummaryJSON(conversation, req.user.id));
  }

  const name = (req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Group name is required." });
  }
  if (participantIds.length < 2) {
    return res.status(400).json({ code: "INVALID_PARTICIPANTS", message: "Groups need at least 2 other participants." });
  }

  const conversation = await Conversation.create({
    type: "group",
    name,
    participants: [req.user.id, ...participantIds].map((userId) => ({ userId })),
    createdBy: req.user.id,
  });
  await conversation.populate(POPULATE_PARTICIPANTS);
  res.status(201).json(await toConversationSummaryJSON(conversation, req.user.id));
}

async function listMessages(req, res) {
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    return res.status(404).json({ code: "CONVERSATION_NOT_FOUND", message: "Conversation not found." });
  }
  const isParticipant = conversation.participants.some((p) => p.userId.toString() === req.user.id);
  if (!isParticipant) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You are not part of this conversation." });
  }
  const messages = await ConversationMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  res.json(messages.map(toConversationMessageJSON));
}

async function markRead(req, res) {
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    return res.status(404).json({ code: "CONVERSATION_NOT_FOUND", message: "Conversation not found." });
  }
  const participant = conversation.participants.find((p) => p.userId.toString() === req.user.id);
  if (!participant) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You are not part of this conversation." });
  }
  participant.lastReadAt = new Date();
  await conversation.save();
  res.json({ ok: true });
}

module.exports = { list, create, listMessages, markRead, toConversationMessageJSON, toConversationSummaryJSON };
