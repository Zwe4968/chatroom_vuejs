const express = require("express");
const { search } = require("../controllers/users.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/search", requireAuth, asyncHandler(search));

module.exports = router;
