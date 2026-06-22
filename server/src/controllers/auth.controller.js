const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { AVATAR_DIR } = require("../middleware/upload.middleware");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toUserJSON(user) {
  return { uid: user._id.toString(), email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl };
}

async function signup(req, res) {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Email, password and display name are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ code: "INVALID_EMAIL", message: "Invalid email format." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ code: "EMAIL_IN_USE", message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, displayName });
  const token = signToken(user);
  res.status(201).json({ token, user: toUserJSON(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Email and password are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ code: "INVALID_EMAIL", message: "Invalid email format." });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ code: "USER_NOT_FOUND", message: "No account found with this email." });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ code: "WRONG_PASSWORD", message: "Incorrect password. Please try again." });
  }

  const token = signToken(user);
  res.json({ token, user: toUserJSON(user) });
}

function logout(req, res) {
  res.json({ ok: true });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ code: "USER_NOT_FOUND", message: "User no longer exists." });
  }
  res.json({ user: toUserJSON(user) });
}

async function updateProfile(req, res) {
  const displayName = (req.body.displayName || "").trim();

  if (!displayName) {
    return res.status(400).json({ code: "INVALID_DISPLAY_NAME", message: "Display name is required." });
  }
  if (displayName.length > 50) {
    return res.status(400).json({ code: "INVALID_DISPLAY_NAME", message: "Display name must be 50 characters or fewer." });
  }

  const user = await User.findByIdAndUpdate(req.user.id, { displayName }, { new: true });
  const token = signToken(user);
  res.json({ token, user: toUserJSON(user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Current and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ code: "WEAK_PASSWORD", message: "New password must be at least 6 characters." });
  }

  const user = await User.findById(req.user.id);
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ code: "WRONG_PASSWORD", message: "Incorrect password. Please try again." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
}

async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ code: "NO_FILE", message: "No image file was uploaded." });
  }

  const user = await User.findById(req.user.id);
  const previousAvatarUrl = user.avatarUrl;

  user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  if (previousAvatarUrl) {
    try {
      fs.unlinkSync(path.join(AVATAR_DIR, path.basename(previousAvatarUrl)));
    } catch (err) {
      // old file may already be gone, nothing to clean up
    }
  }

  const token = signToken(user);
  res.json({ token, user: toUserJSON(user) });
}

module.exports = { signup, login, logout, me, updateProfile, changePassword, uploadAvatar };
