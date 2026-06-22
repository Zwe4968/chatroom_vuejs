const Notification = require("../models/Notification");
const { toNotificationJSON } = require("../utils/notify");

async function list(req, res) {
  const notifications = await Notification.find({ recipientId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications.map(toNotificationJSON));
}

async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ recipientId: req.user.id, read: false });
  res.json({ count });
}

async function markRead(req, res) {
  const notification = await Notification.findOne({ _id: req.params.id, recipientId: req.user.id });
  if (!notification) {
    return res.status(404).json({ code: "NOTIFICATION_NOT_FOUND", message: "Notification not found." });
  }
  notification.read = true;
  await notification.save();
  res.json(toNotificationJSON(notification));
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipientId: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
}

module.exports = { list, unreadCount, markRead, markAllRead };
