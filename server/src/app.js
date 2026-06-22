const express = require("express");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const messagesRoutes = require("./routes/messages.routes");
const projectsRoutes = require("./routes/projects.routes");
const cardsRoutes = require("./routes/cards.routes");
const cardMessagesRoutes = require("./routes/cardMessages.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const usersRoutes = require("./routes/users.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/card-messages", cardMessagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/conversations", conversationsRoutes);

app.use(errorHandler);

module.exports = app;
