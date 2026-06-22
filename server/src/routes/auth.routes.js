const express = require("express");
const { signup, login, logout, me, updateProfile, changePassword, uploadAvatar } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", requireAuth, asyncHandler(me));
router.put("/me", requireAuth, asyncHandler(updateProfile));
router.put("/me/password", requireAuth, asyncHandler(changePassword));
router.post("/me/avatar", requireAuth, upload.single("avatar"), asyncHandler(uploadAvatar));

module.exports = router;
