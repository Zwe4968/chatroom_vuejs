const Notification = require("../models/Notification");

function toNotificationJSON(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    projectId: doc.projectId.toString(),
    cardId: doc.cardId ? doc.cardId.toString() : null,
    message: doc.message,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}

async function notifyMembers(io, { project, actorId, type, message, cardId, excludeUserIds = [] }) {
  const excluded = new Set([actorId, ...excludeUserIds].map(String));
  const recipientIds = project.members
    .map((m) => m.userId.toString())
    .filter((id) => !excluded.has(id));

  if (!recipientIds.length) return;

  const docs = await Notification.insertMany(
    recipientIds.map((recipientId) => ({
      recipientId,
      actorId,
      type,
      projectId: project._id,
      cardId: cardId || null,
      message,
    }))
  );

  docs.forEach((doc) => {
    io.to(`user:${doc.recipientId}`).emit("notification:new", toNotificationJSON(doc));
  });
}

async function notifyUsers(io, { recipientIds, actorId, type, message, projectId, cardId }) {
  const targets = recipientIds.map(String).filter((id) => id !== String(actorId));
  if (!targets.length) return;

  const docs = await Notification.insertMany(
    targets.map((recipientId) => ({
      recipientId,
      actorId,
      type,
      projectId,
      cardId: cardId || null,
      message,
    }))
  );

  docs.forEach((doc) => {
    io.to(`user:${doc.recipientId}`).emit("notification:new", toNotificationJSON(doc));
  });
}

module.exports = { notifyMembers, notifyUsers, toNotificationJSON };
