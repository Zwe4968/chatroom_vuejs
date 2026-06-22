const Project = require("../models/Project");
const Card = require("../models/Card");

const ROLE_RANK = { viewer: 1, member: 2, admin: 3, owner: 4 };

function roleAtLeast(role, min) {
  return !!role && ROLE_RANK[role] >= ROLE_RANK[min];
}

function bestRole(roles) {
  return roles.reduce((best, role) => {
    if (!role) return best;
    if (!best || ROLE_RANK[role] > ROLE_RANK[best]) return role;
    return best;
  }, null);
}

function lowestRole(roles) {
  return roles.reduce((worst, role) => {
    if (!role) return worst;
    if (!worst || ROLE_RANK[role] < ROLE_RANK[worst]) return role;
    return worst;
  }, null);
}

async function requireProjectMember(req, res, next) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "Project not found." });
  }
  const member = project.members.find((m) => m.userId.toString() === req.user.id);
  if (!member) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You are not a member of this project." });
  }
  req.project = project;
  req.projectRole = member.role;
  next();
}

function requireProjectRole(...roles) {
  const min = lowestRole(roles);
  return (req, res, next) => {
    if (!roleAtLeast(req.projectRole, min)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
    }
    next();
  };
}

async function requireProjectView(req, res, next) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "Project not found." });
  }
  const member = project.members.find((m) => m.userId.toString() === req.user.id);
  if (member) {
    req.project = project;
    req.projectRole = member.role;
    return next();
  }
  if (project.visibility === "public") {
    req.project = project;
    req.projectRole = null;
    return next();
  }
  return res.status(403).json({ code: "FORBIDDEN", message: "This project is private." });
}

async function requireCardAccess(req, res, next) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ code: "CARD_NOT_FOUND", message: "Card not found." });
  }
  const projects = await Project.find({ _id: { $in: card.projectIds }, "members.userId": req.user.id });
  const myRoles = projects.flatMap((p) => p.members.filter((m) => m.userId.toString() === req.user.id).map((m) => m.role));
  const role = bestRole(myRoles);
  if (!role) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You do not have access to this card." });
  }
  req.card = card;
  req.cardRole = role;
  next();
}

function requireCardRole(...roles) {
  const min = lowestRole(roles);
  return (req, res, next) => {
    if (!roleAtLeast(req.cardRole, min)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
    }
    next();
  };
}

async function requireCardView(req, res, next) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ code: "CARD_NOT_FOUND", message: "Card not found." });
  }
  const linkedProjects = await Project.find({ _id: { $in: card.projectIds } });
  const myRoles = linkedProjects.flatMap((p) => p.members.filter((m) => m.userId.toString() === req.user.id).map((m) => m.role));
  const role = bestRole(myRoles);
  if (role) {
    req.card = card;
    req.cardRole = role;
    return next();
  }
  const hasPublicProject = linkedProjects.some((p) => p.visibility === "public");
  if (hasPublicProject) {
    req.card = card;
    req.cardRole = null;
    return next();
  }
  return res.status(403).json({ code: "FORBIDDEN", message: "You do not have access to this card." });
}

module.exports = {
  ROLE_RANK, roleAtLeast, bestRole, lowestRole,
  requireProjectMember, requireProjectRole, requireProjectView,
  requireCardAccess, requireCardRole, requireCardView,
};
