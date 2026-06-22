const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
