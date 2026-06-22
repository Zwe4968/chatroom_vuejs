const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");
const { toConversationMessageJSON } = require("../controllers/conversations.controller");

function registerConversationSockets(io, socket) {
  socket.conversationIds = socket.conversationIds || new Set();

  socket.on("conversation:join", async ({ conversationId }, ack) => {
    const conversation = await Conversation.findById(conversationId);
    const isParticipant = !!conversation && conversation.participants.some((p) => p.userId.toString() === socket.user.id);
    if (!isParticipant) {
      socket.emit("conversation:error", { code: "FORBIDDEN" });
      if (typeof ack === "function") ack({ ok: false });
      return;
    }
    socket.conversationIds.add(conversationId);
    socket.join(`conversation:${conversationId}`);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("conversation:leave", ({ conversationId }) => {
    socket.conversationIds.delete(conversationId);
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("conversation:message:send", async ({ conversationId, message }) => {
    if (!message || !message.trim()) return;
    if (!socket.rooms.has(`conversation:${conversationId}`)) {
      socket.emit("conversation:error", { code: "FORBIDDEN" });
      return;
    }

    const doc = await ConversationMessage.create({
      conversationId,
      message,
      name: socket.user.displayName,
      userId: socket.user.id,
      avatarUrl: socket.user.avatarUrl,
    });
    await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: doc.createdAt });
    io.to(`conversation:${conversationId}`).emit("conversation:message:new", toConversationMessageJSON(doc));

    const conversation = await Conversation.findById(conversationId);
    const roomSocketIds = io.sockets.adapter.rooms.get(`conversation:${conversationId}`) || new Set();
    const activeUserIds = new Set(
      [...roomSocketIds].map((id) => io.sockets.sockets.get(id)).filter(Boolean).map((s) => s.user.id)
    );
    conversation.participants.forEach((p) => {
      const userId = p.userId.toString();
      if (userId !== socket.user.id && !activeUserIds.has(userId)) {
        io.to(`user:${userId}`).emit("conversation:unread", { conversationId, message: doc.message, name: doc.name });
      }
    });
  });
}

module.exports = registerConversationSockets;
