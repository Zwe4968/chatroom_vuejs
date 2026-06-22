const { verifyToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "No token provided." });
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName, avatarUrl: payload.avatarUrl };
    next();
  } catch (err) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired token." });
  }
}

module.exports = { requireAuth };
