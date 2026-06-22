const Project = require("../models/Project");
const Card = require("../models/Card");
const CardMessage = require("../models/CardMessage");
const User = require("../models/User");
const JoinRequest = require("../models/JoinRequest");
const { roleAtLeast } = require("../middleware/membership.middleware");
const { notifyMembers, notifyUsers } = require("../utils/notify");

const ASSIGNABLE_ROLES = ["admin", "member", "viewer"];
const VISIBILITIES = ["private", "public"];

function toMemberJSON(member) {
  const user = member.userId;
  const isPopulated = user && typeof user === "object" && user.displayName !== undefined;
  return {
    userId: isPopulated ? user._id.toString() : user.toString(),
    displayName: isPopulated ? user.displayName : undefined,
    email: isPopulated ? user.email : undefined,
    avatarUrl: isPopulated ? user.avatarUrl : undefined,
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

function memberUserId(member) {
  const user = member.userId;
  const isPopulated = user && typeof user === "object" && user.displayName !== undefined;
  return isPopulated ? user._id.toString() : user.toString();
}

function toProjectJSON(doc, viewerUserId) {
  const myMember = doc.members.find((m) => memberUserId(m) === viewerUserId);
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    ownerId: doc.ownerId.toString(),
    visibility: doc.visibility,
    myRole: myMember ? myMember.role : null,
    isMember: !!myMember,
    members: doc.members.map(toMemberJSON),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function list(req, res) {
  const projects = await Project.find({ "members.userId": req.user.id })
    .populate("members.userId", "displayName email avatarUrl")
    .sort({ updatedAt: -1 });
  res.json(projects.map((p) => toProjectJSON(p, req.user.id)));
}

async function listPublic(req, res) {
  const projects = await Project.find({ visibility: "public" })
    .populate("members.userId", "displayName email avatarUrl")
    .sort({ updatedAt: -1 })
    .limit(100);
  res.json(projects.map((p) => toProjectJSON(p, req.user.id)));
}

async function get(req, res) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "Project not found." });
  }

  const isMember = project.members.some((m) => m.userId.toString() === req.user.id);
  if (!isMember && project.visibility !== "public") {
    return res.json({ id: project._id.toString(), name: project.name, visibility: project.visibility, myRole: null, isPrivatePreview: true });
  }

  await project.populate("members.userId", "displayName email avatarUrl");
  res.json(toProjectJSON(project, req.user.id));
}

async function create(req, res) {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const visibility = req.body.visibility || "private";

  if (!name) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Project name is required." });
  }
  if (name.length > 100) {
    return res.status(400).json({ code: "INVALID_NAME", message: "Project name must be 100 characters or fewer." });
  }
  if (!VISIBILITIES.includes(visibility)) {
    return res.status(400).json({ code: "INVALID_VISIBILITY", message: "Invalid visibility." });
  }

  const project = await Project.create({
    name,
    description,
    visibility,
    ownerId: req.user.id,
    members: [{ userId: req.user.id, role: "owner" }],
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.status(201).json(toProjectJSON(project, req.user.id));
}

async function update(req, res) {
  const project = req.project;

  if (req.body.name !== undefined) {
    const name = req.body.name.trim();
    if (!name) {
      return res.status(400).json({ code: "INVALID_NAME", message: "Project name is required." });
    }
    project.name = name;
  }
  if (req.body.description !== undefined) {
    project.description = req.body.description.trim();
  }

  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "project_updated",
    message: `${req.user.displayName} updated the project "${project.name}".`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.json(toProjectJSON(project, req.user.id));
}

async function updateVisibility(req, res) {
  const project = req.project;
  const visibility = req.body.visibility;
  if (!VISIBILITIES.includes(visibility)) {
    return res.status(400).json({ code: "INVALID_VISIBILITY", message: "Invalid visibility." });
  }
  project.visibility = visibility;
  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "project_visibility_changed",
    message: `${req.user.displayName} made "${project.name}" ${visibility}.`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.json(toProjectJSON(project, req.user.id));
}

async function remove(req, res) {
  const project = req.project;

  await Card.updateMany({ projectIds: project._id }, { $pull: { projectIds: project._id } });
  const orphanedCards = await Card.find({ projectIds: { $size: 0 } });
  const orphanedCardIds = orphanedCards.map((c) => c._id);
  if (orphanedCardIds.length) {
    await CardMessage.deleteMany({ cardId: { $in: orphanedCardIds } });
    await Card.deleteMany({ _id: { $in: orphanedCardIds } });
  }
  await project.deleteOne();
  res.json({ ok: true });
}

async function addMember(req, res) {
  const project = req.project;
  const email = (req.body.email || "").trim().toLowerCase();
  const role = req.body.role || "member";

  if (!email) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Email is required." });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ code: "INVALID_ROLE", message: "Invalid role." });
  }
  if (role === "admin" && req.projectRole !== "owner") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only the project owner can invite a member as admin." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ code: "USER_NOT_FOUND", message: "No account found with this email." });
  }

  const alreadyMember = project.members.some((m) => m.userId.toString() === user._id.toString());
  if (alreadyMember) {
    return res.status(409).json({ code: "ALREADY_MEMBER", message: "This user is already a member of the project." });
  }

  project.members.push({ userId: user._id, role });
  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "member_added",
    message: `${req.user.displayName} added ${user.displayName} to "${project.name}".`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.status(201).json(toProjectJSON(project, req.user.id));
}

async function removeMember(req, res) {
  const project = req.project;
  const targetUserId = req.params.userId;
  const isSelf = targetUserId === req.user.id;
  const canManageMembers = roleAtLeast(req.projectRole, "admin");

  if (targetUserId === project.ownerId.toString()) {
    return res.status(409).json({ code: "CANNOT_REMOVE_OWNER", message: "The project owner cannot be removed." });
  }
  if (!canManageMembers && !isSelf) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only an admin or owner can remove other members." });
  }

  const removedUser = await User.findById(targetUserId);
  project.members = project.members.filter((m) => m.userId.toString() !== targetUserId);
  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "member_removed",
    message: `${req.user.displayName} removed ${removedUser ? removedUser.displayName : "a member"} from "${project.name}".`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.json(toProjectJSON(project, req.user.id));
}

async function updateMemberRole(req, res) {
  const project = req.project;
  const targetUserId = req.params.userId;
  const role = req.body.role;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ code: "INVALID_ROLE", message: "Invalid role." });
  }
  if (targetUserId === project.ownerId.toString()) {
    return res.status(409).json({ code: "CANNOT_CHANGE_OWNER_ROLE", message: "The project owner's role cannot be changed." });
  }
  if (role === "admin" && req.projectRole !== "owner") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only the project owner can promote a member to admin." });
  }

  const member = project.members.find((m) => m.userId.toString() === targetUserId);
  if (!member) {
    return res.status(404).json({ code: "MEMBER_NOT_FOUND", message: "This user is not a member of the project." });
  }

  const targetUser = await User.findById(targetUserId);
  member.role = role;
  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "member_role_changed",
    message: `${req.user.displayName} changed ${targetUser ? targetUser.displayName : "a member"}'s role to ${role} in "${project.name}".`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.json(toProjectJSON(project, req.user.id));
}

async function joinPublic(req, res) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "Project not found." });
  }
  if (project.visibility !== "public") {
    return res.status(409).json({ code: "NOT_PUBLIC", message: "This project is not public." });
  }
  const alreadyMember = project.members.some((m) => m.userId.toString() === req.user.id);
  if (alreadyMember) {
    return res.status(409).json({ code: "ALREADY_MEMBER", message: "You are already a member of this project." });
  }

  project.members.push({ userId: req.user.id, role: "viewer" });
  await project.save();
  await notifyMembers(req.app.get("io"), {
    project, actorId: req.user.id, type: "member_added",
    message: `${req.user.displayName} joined "${project.name}".`,
  });
  await project.populate("members.userId", "displayName email avatarUrl");
  res.status(201).json(toProjectJSON(project, req.user.id));
}

function toJoinRequestJSON(doc) {
  const user = doc.userId;
  const isPopulated = user && typeof user === "object" && user.displayName !== undefined;
  return {
    id: doc._id.toString(),
    userId: isPopulated ? user._id.toString() : user.toString(),
    displayName: isPopulated ? user.displayName : undefined,
    email: isPopulated ? user.email : undefined,
    avatarUrl: isPopulated ? user.avatarUrl : undefined,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

async function requestToJoin(req, res) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "Project not found." });
  }
  const myMember = project.members.find((m) => m.userId.toString() === req.user.id);
  if (myMember && myMember.role !== "viewer") {
    return res.status(409).json({ code: "ALREADY_MEMBER", message: "You already have full access to this project." });
  }
  const existingPending = await JoinRequest.findOne({ projectId: project._id, userId: req.user.id, status: "pending" });
  if (existingPending) {
    return res.status(409).json({ code: "ALREADY_REQUESTED", message: "You already have a pending request for this project." });
  }

  const joinRequest = await JoinRequest.create({ projectId: project._id, userId: req.user.id });
  const approverIds = project.members.filter((m) => m.role === "owner" || m.role === "admin").map((m) => m.userId);
  await notifyUsers(req.app.get("io"), {
    recipientIds: approverIds, actorId: req.user.id, type: "join_requested", projectId: project._id,
    message: `${req.user.displayName} requested to join "${project.name}".`,
  });
  res.status(201).json(toJoinRequestJSON({ ...joinRequest.toObject(), userId: req.user.id }));
}

async function listJoinRequests(req, res) {
  const requests = await JoinRequest.find({ projectId: req.project._id, status: "pending" })
    .populate("userId", "displayName email avatarUrl")
    .sort({ createdAt: -1 });
  res.json(requests.map(toJoinRequestJSON));
}

async function approveJoinRequest(req, res) {
  const project = req.project;
  const role = req.body.role || "member";
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ code: "INVALID_ROLE", message: "Invalid role." });
  }
  if (role === "admin" && req.projectRole !== "owner") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only the project owner can grant admin." });
  }
  const joinRequest = await JoinRequest.findOne({ _id: req.params.requestId, projectId: project._id, status: "pending" });
  if (!joinRequest) {
    return res.status(404).json({ code: "REQUEST_NOT_FOUND", message: "Join request not found." });
  }

  const existingMember = project.members.find((m) => m.userId.toString() === joinRequest.userId.toString());
  if (existingMember) {
    existingMember.role = role;
  } else {
    project.members.push({ userId: joinRequest.userId, role });
  }
  await project.save();
  joinRequest.status = "approved";
  await joinRequest.save();

  await notifyUsers(req.app.get("io"), {
    recipientIds: [joinRequest.userId], actorId: req.user.id, type: "join_request_approved", projectId: project._id,
    message: `${req.user.displayName} approved your request to join "${project.name}" as ${role}.`,
  });
  res.json({ ok: true });
}

async function denyJoinRequest(req, res) {
  const project = req.project;
  const joinRequest = await JoinRequest.findOne({ _id: req.params.requestId, projectId: project._id, status: "pending" });
  if (!joinRequest) {
    return res.status(404).json({ code: "REQUEST_NOT_FOUND", message: "Join request not found." });
  }

  joinRequest.status = "denied";
  await joinRequest.save();

  await notifyUsers(req.app.get("io"), {
    recipientIds: [joinRequest.userId], actorId: req.user.id, type: "join_request_denied", projectId: project._id,
    message: `${req.user.displayName} denied your request to join "${project.name}". You still have view-only access if the project is public.`,
  });
  res.json({ ok: true });
}

module.exports = {
  list, listPublic, get, create, update, updateVisibility, remove,
  addMember, removeMember, updateMemberRole, joinPublic,
  requestToJoin, listJoinRequests, approveJoinRequest, denyJoinRequest,
  toProjectJSON,
};
