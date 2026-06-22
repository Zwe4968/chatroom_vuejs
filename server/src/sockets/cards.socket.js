const Card = require("../models/Card");
const Project = require("../models/Project");
const CardMessage = require("../models/CardMessage");
const { toCardMessageJSON } = require("../controllers/cardMessages.controller");
const { bestRole, roleAtLeast } = require("../middleware/membership.middleware");
const { notifyMembers } = require("../utils/notify");

async function resolveCardRole(cardId, userId) {
  const card = await Card.findById(cardId);
  if (!card) return { allowed: false, role: null };
  const linkedProjects = await Project.find({ _id: { $in: card.projectIds } });
  const myRoles = linkedProjects.flatMap((p) => p.members.filter((m) => m.userId.toString() === userId).map((m) => m.role));
  const role = bestRole(myRoles);
  if (role) return { allowed: true, role };
  const hasPublicProject = linkedProjects.some((p) => p.visibility === "public");
  return { allowed: hasPublicProject, role: null };
}

function activeViewerIds(io, room) {
  const socketIds = io.sockets.adapter.rooms.get(room);
  if (!socketIds) return [];
  return [...socketIds]
    .map((socketId) => io.sockets.sockets.get(socketId))
    .filter(Boolean)
    .map((s) => s.user.id);
}

function registerCardSockets(io, socket) {
  socket.cardRoles = socket.cardRoles || {};

  socket.on("card:join", async ({ cardId }, ack) => {
    const { allowed, role } = await resolveCardRole(cardId, socket.user.id);
    if (!allowed) {
      socket.emit("card:error", { code: "FORBIDDEN" });
      if (typeof ack === "function") ack({ ok: false });
      return;
    }
    socket.cardRoles[cardId] = role;
    socket.join(`card:${cardId}`);
    if (typeof ack === "function") ack({ ok: true, role });
  });

  socket.on("card:leave", ({ cardId }) => {
    delete socket.cardRoles[cardId];
    socket.leave(`card:${cardId}`);
  });

  socket.on("card:message:send", async ({ cardId, message }) => {
    if (!message || !message.trim()) return;
    if (!socket.rooms.has(`card:${cardId}`) || !roleAtLeast(socket.cardRoles[cardId], "member")) {
      socket.emit("card:error", { code: "FORBIDDEN" });
      return;
    }
    const doc = await CardMessage.create({
      cardId,
      message,
      name: socket.user.displayName,
      userId: socket.user.id,
      avatarUrl: socket.user.avatarUrl,
    });
    io.to(`card:${cardId}`).emit("card:message:new", toCardMessageJSON(doc));

    const card = await Card.findById(cardId);
    const linkedProjects = await Project.find({ _id: { $in: card.projectIds } });
    const viewerIds = activeViewerIds(io, `card:${cardId}`);
    for (const project of linkedProjects) {
      await notifyMembers(io, {
        project, actorId: socket.user.id, type: "card_chat_message", cardId,
        message: `${socket.user.displayName} sent a message in "${card.title}".`,
        excludeUserIds: viewerIds,
      });
    }
  });
}

module.exports = registerCardSockets;
