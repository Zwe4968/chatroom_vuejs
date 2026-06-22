const express = require("express");
const { list, create, listMessages, markRead } = require("../controllers/conversations.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(list));
router.post("/", requireAuth, asyncHandler(create));
router.get("/:conversationId/messages", requireAuth, asyncHandler(listMessages));
router.put("/:conversationId/read", requireAuth, asyncHandler(markRead));

module.exports = router;
