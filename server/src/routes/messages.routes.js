const express = require("express");
const { list, create } = require("../controllers/messages.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(list));
router.post("/", requireAuth, asyncHandler(create));

module.exports = router;
