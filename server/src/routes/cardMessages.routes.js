const express = require("express");
const { list } = require("../controllers/cardMessages.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCardView } = require("../middleware/membership.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/:cardId", requireAuth, asyncHandler(requireCardView), asyncHandler(list));

module.exports = router;
