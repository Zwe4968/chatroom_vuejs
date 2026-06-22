const express = require("express");
const {
  listForProject, get, create, update, remove, reorder,
  addTask, updateTask, removeTask,
  addLink, removeLink,
  addNote, removeNote,
  addAcknowledgement, removeAcknowledgement,
} = require("../controllers/cards.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectView, requireCardAccess, requireCardRole, requireCardView } = require("../middleware/membership.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const requireWrite = requireCardRole("owner", "admin", "member");

router.get("/project/:projectId", requireAuth, asyncHandler(requireProjectView), asyncHandler(listForProject));
router.post("/", requireAuth, asyncHandler(create));

router.get("/:cardId", requireAuth, asyncHandler(requireCardView), asyncHandler(get));
router.put("/:cardId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(update));
router.delete("/:cardId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(remove));
router.put("/:cardId/reorder", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(reorder));

router.post("/:cardId/tasks", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(addTask));
router.put("/:cardId/tasks/:taskId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(updateTask));
router.delete("/:cardId/tasks/:taskId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(removeTask));

router.post("/:cardId/links", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(addLink));
router.delete("/:cardId/links/:linkId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(removeLink));

router.post("/:cardId/notes", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(addNote));
router.delete("/:cardId/notes/:noteId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(removeNote));

router.post("/:cardId/acknowledgements", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(addAcknowledgement));
router.delete("/:cardId/acknowledgements/:ackId", requireAuth, asyncHandler(requireCardAccess), requireWrite, asyncHandler(removeAcknowledgement));

module.exports = router;
