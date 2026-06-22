const { verifyToken } = require("../utils/jwt");
const Message = require("../models/Message");
const { toMessageJSON } = require("../controllers/messages.controller");
const registerCardSockets = require("./cards.socket");
const registerConversationSockets = require("./conversations.socket");

function initSockets(io) {
  io.use((socket, next) => {
    try {
      const payload = verifyToken(socket.handshake.auth.token);
      socket.user = { id: payload.sub, email: payload.email, displayName: payload.displayName, avatarUrl: payload.avatarUrl };
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("message:send", async ({ message }) => {
      if (!message || !message.trim()) return;
      const doc = await Message.create({
        message,
        name: socket.user.displayName,
        userId: socket.user.id,
        avatarUrl: socket.user.avatarUrl,
      });
      io.emit("message:new", toMessageJSON(doc));
    });

    registerCardSockets(io, socket);
    registerConversationSockets(io, socket);
  });
}

module.exports = initSockets;
