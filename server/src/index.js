const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const initSockets = require("./sockets");
const { AVATAR_DIR } = require("./middleware/upload.middleware");

async function main() {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  await connectDB();

  const allowedOrigins = (process.env.CLIENT_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  });
  initSockets(io);
  app.set("io", io);

  const port = process.env.PORT || 5000;
  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
