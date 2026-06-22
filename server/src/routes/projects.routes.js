const express = require("express");
const {
  list, listPublic, get, create, update, updateVisibility, remove,
  addMember, removeMember, updateMemberRole, joinPublic,
  requestToJoin, listJoinRequests, approveJoinRequest, denyJoinRequest,
} = require("../controllers/projects.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectMember, requireProjectRole } = require("../middleware/membership.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(list));
router.get("/public", requireAuth, asyncHandler(listPublic));
router.post("/", requireAuth, asyncHandler(create));

router.get("/:projectId", requireAuth, asyncHandler(get));
router.put("/:projectId", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(update));
router.put("/:projectId/visibility", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner"), asyncHandler(updateVisibility));
router.delete("/:projectId", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner"), asyncHandler(remove));
router.post("/:projectId/join", requireAuth, asyncHandler(joinPublic));

router.post("/:projectId/join-requests", requireAuth, asyncHandler(requestToJoin));
router.get("/:projectId/join-requests", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(listJoinRequests));
router.post("/:projectId/join-requests/:requestId/approve", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(approveJoinRequest));
router.post("/:projectId/join-requests/:requestId/deny", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(denyJoinRequest));

router.post("/:projectId/members", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(addMember));
router.delete("/:projectId/members/:userId", requireAuth, asyncHandler(requireProjectMember), asyncHandler(removeMember));
router.put("/:projectId/members/:userId/role", requireAuth, asyncHandler(requireProjectMember), requireProjectRole("owner", "admin"), asyncHandler(updateMemberRole));

module.exports = router;
