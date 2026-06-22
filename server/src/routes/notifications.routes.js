const express = require("express");
const { list, unreadCount, markRead, markAllRead } = require("../controllers/notifications.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(list));
router.get("/unread-count", requireAuth, asyncHandler(unreadCount));
router.put("/:id/read", requireAuth, asyncHandler(markRead));
router.put("/read-all", requireAuth, asyncHandler(markAllRead));

module.exports = router;
