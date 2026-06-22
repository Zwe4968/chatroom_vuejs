const Card = require("../models/Card");
const Project = require("../models/Project");
const { notifyMembers, notifyUsers } = require("../utils/notify");

const STATUSES = ["todo", "in_progress", "review", "completed"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const ACK_TYPES = ["approve", "confirm", "review", "completed"];

function toUserRef(value) {
  if (!value) return null;
  const isPopulated = typeof value === "object" && value.displayName !== undefined;
  if (isPopulated) {
    return { id: value._id.toString(), displayName: value.displayName, avatarUrl: value.avatarUrl };
  }
  return { id: value.toString() };
}

function toCardJSON(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    projectIds: doc.projectIds.map((id) => id.toString()),
    status: doc.status,
    priority: doc.priority,
    assignees: doc.assignees.map(toUserRef),
    dueDate: doc.dueDate,
    createdBy: toUserRef(doc.createdBy),
    position: doc.position,
    tasks: doc.tasks.map((t) => ({ id: t._id.toString(), text: t.text, done: t.done, createdAt: t.createdAt })),
    links: doc.links.map((l) => ({ id: l._id.toString(), label: l.label, url: l.url, createdAt: l.createdAt })),
    notes: doc.notes.map((n) => ({ id: n._id.toString(), text: n.text, author: toUserRef(n.authorId), createdAt: n.createdAt })),
    acknowledgements: doc.acknowledgements.map((a) => ({ id: a._id.toString(), user: toUserRef(a.userId), type: a.type, createdAt: a.createdAt })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const POPULATE_FIELDS = [
  { path: "assignees", select: "displayName avatarUrl" },
  { path: "createdBy", select: "displayName avatarUrl" },
  { path: "notes.authorId", select: "displayName avatarUrl" },
  { path: "acknowledgements.userId", select: "displayName avatarUrl" },
];

async function moveCardToPosition(card, projectId, newStatus, newPosition) {
  const oldStatus = card.status;
  const oldPosition = card.position;

  if (oldStatus === newStatus) {
    if (newPosition === oldPosition) return;
    if (newPosition < oldPosition) {
      await Card.updateMany(
        { _id: { $ne: card._id }, projectIds: projectId, status: newStatus, position: { $gte: newPosition, $lt: oldPosition } },
        { $inc: { position: 1 } }
      );
    } else {
      await Card.updateMany(
        { _id: { $ne: card._id }, projectIds: projectId, status: newStatus, position: { $gt: oldPosition, $lte: newPosition } },
        { $inc: { position: -1 } }
      );
    }
  } else {
    await Card.updateMany(
      { _id: { $ne: card._id }, projectIds: projectId, status: oldStatus, position: { $gt: oldPosition } },
      { $inc: { position: -1 } }
    );
    await Card.updateMany(
      { _id: { $ne: card._id }, projectIds: projectId, status: newStatus, position: { $gte: newPosition } },
      { $inc: { position: 1 } }
    );
  }

  card.status = newStatus;
  card.position = newPosition;
  await card.save();
}

async function listForProject(req, res) {
  const cards = await Card.find({ projectIds: req.params.projectId })
    .populate(POPULATE_FIELDS)
    .sort({ status: 1, position: 1 });
  res.json(cards.map(toCardJSON));
}

async function get(req, res) {
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

async function create(req, res) {
  const title = (req.body.title || "").trim();
  const projectIds = Array.isArray(req.body.projectIds) ? req.body.projectIds : [];
  const status = req.body.status || "todo";
  const priority = req.body.priority || "medium";

  if (!title) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Card title is required." });
  }
  if (!projectIds.length) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "At least one project must be assigned." });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ code: "INVALID_STATUS", message: "Invalid status." });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ code: "INVALID_PRIORITY", message: "Invalid priority." });
  }

  const projects = await Project.find({ _id: { $in: projectIds }, "members.userId": req.user.id });
  const hasWriteAccessToAll = projects.length === projectIds.length
    && projects.every((p) => p.members.some((m) => m.userId.toString() === req.user.id && m.role !== "viewer"));
  if (!hasWriteAccessToAll) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You must have write access to every assigned project." });
  }

  const position = await Card.countDocuments({ projectIds: projectIds[0], status });

  const card = await Card.create({
    title,
    description: (req.body.description || "").trim(),
    projectIds,
    status,
    priority,
    assignees: Array.isArray(req.body.assignees) ? req.body.assignees : [],
    dueDate: req.body.dueDate || null,
    createdBy: req.user.id,
    position,
  });

  const io = req.app.get("io");
  for (const project of projects) {
    await notifyMembers(io, {
      project, actorId: req.user.id, type: "card_created", cardId: card._id,
      message: `${req.user.displayName} created card "${title}" in "${project.name}".`,
    });
  }

  await card.populate(POPULATE_FIELDS);
  res.status(201).json(toCardJSON(card));
}

async function update(req, res) {
  const card = req.card;
  const body = req.body;
  const previousAssignees = card.assignees.map((id) => id.toString());

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return res.status(400).json({ code: "INVALID_TITLE", message: "Card title is required." });
    }
    card.title = title;
  }
  if (body.description !== undefined) {
    card.description = body.description.trim();
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return res.status(400).json({ code: "INVALID_PRIORITY", message: "Invalid priority." });
    }
    card.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    card.dueDate = body.dueDate || null;
  }
  if (body.assignees !== undefined) {
    card.assignees = Array.isArray(body.assignees) ? body.assignees : [];
  }
  if (body.projectIds !== undefined) {
    if (!Array.isArray(body.projectIds) || !body.projectIds.length) {
      return res.status(400).json({ code: "MISSING_FIELDS", message: "At least one project must be assigned." });
    }
    const projects = await Project.find({ _id: { $in: body.projectIds }, "members.userId": req.user.id });
    const hasWriteAccessToAll = projects.length === body.projectIds.length
      && projects.every((p) => p.members.some((m) => m.userId.toString() === req.user.id && m.role !== "viewer"));
    if (!hasWriteAccessToAll) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You must have write access to every assigned project." });
    }
    card.projectIds = body.projectIds;
  }

  await card.save();

  if (body.assignees !== undefined) {
    const newlyAssigned = card.assignees.map((id) => id.toString()).filter((id) => !previousAssignees.includes(id));
    if (newlyAssigned.length) {
      await notifyUsers(req.app.get("io"), {
        recipientIds: newlyAssigned, actorId: req.user.id, type: "card_assigned",
        projectId: card.projectIds[0], cardId: card._id,
        message: `${req.user.displayName} assigned you to "${card.title}".`,
      });
    }
  }

  await card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(card));
}

async function remove(req, res) {
  await req.card.deleteOne();
  res.json({ ok: true });
}

async function reorder(req, res) {
  const card = req.card;
  const { status, position, projectId } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ code: "INVALID_STATUS", message: "Invalid status." });
  }
  if (typeof position !== "number" || position < 0) {
    return res.status(400).json({ code: "INVALID_POSITION", message: "Invalid position." });
  }
  if (!projectId || !card.projectIds.some((id) => id.toString() === projectId)) {
    return res.status(400).json({ code: "INVALID_PROJECT", message: "projectId must be one of the card's projects." });
  }

  const columnSize = await Card.countDocuments({ projectIds: projectId, status, _id: { $ne: card._id } });
  const clampedPosition = Math.max(0, Math.min(position, columnSize));
  const statusChanged = card.status !== status;

  await moveCardToPosition(card, projectId, status, clampedPosition);

  if (statusChanged) {
    const project = await Project.findById(projectId);
    if (project) {
      await notifyMembers(req.app.get("io"), {
        project, actorId: req.user.id, type: "card_status_changed", cardId: card._id,
        message: `${req.user.displayName} moved "${card.title}" to ${status.replace("_", " ")}.`,
      });
    }
  }

  await card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(card));
}

async function addTask(req, res) {
  const text = (req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Task text is required." });
  }
  req.card.tasks.push({ text });
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.status(201).json(toCardJSON(req.card));
}

async function updateTask(req, res) {
  const task = req.card.tasks.id(req.params.taskId);
  if (!task) {
    return res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found." });
  }
  if (req.body.text !== undefined) {
    const text = req.body.text.trim();
    if (!text) {
      return res.status(400).json({ code: "INVALID_TEXT", message: "Task text is required." });
    }
    task.text = text;
  }
  if (req.body.done !== undefined) {
    task.done = !!req.body.done;
  }
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

async function removeTask(req, res) {
  const task = req.card.tasks.id(req.params.taskId);
  if (!task) {
    return res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found." });
  }
  task.deleteOne();
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

async function addLink(req, res) {
  const label = (req.body.label || "").trim();
  const url = (req.body.url || "").trim();
  if (!label || !url) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Link label and URL are required." });
  }
  req.card.links.push({ label, url });
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.status(201).json(toCardJSON(req.card));
}

async function removeLink(req, res) {
  const link = req.card.links.id(req.params.linkId);
  if (!link) {
    return res.status(404).json({ code: "LINK_NOT_FOUND", message: "Link not found." });
  }
  link.deleteOne();
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

async function addNote(req, res) {
  const text = (req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ code: "MISSING_FIELDS", message: "Note text is required." });
  }
  req.card.notes.push({ text, authorId: req.user.id });
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.status(201).json(toCardJSON(req.card));
}

async function removeNote(req, res) {
  const note = req.card.notes.id(req.params.noteId);
  if (!note) {
    return res.status(404).json({ code: "NOTE_NOT_FOUND", message: "Note not found." });
  }
  if (note.authorId.toString() !== req.user.id) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You can only remove your own notes." });
  }
  note.deleteOne();
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

async function addAcknowledgement(req, res) {
  const type = req.body.type;
  if (!ACK_TYPES.includes(type)) {
    return res.status(400).json({ code: "INVALID_TYPE", message: "Invalid acknowledgement type." });
  }
  req.card.acknowledgements.push({ userId: req.user.id, type });
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.status(201).json(toCardJSON(req.card));
}

async function removeAcknowledgement(req, res) {
  const ack = req.card.acknowledgements.id(req.params.ackId);
  if (!ack) {
    return res.status(404).json({ code: "ACK_NOT_FOUND", message: "Acknowledgement not found." });
  }
  if (ack.userId.toString() !== req.user.id) {
    return res.status(403).json({ code: "FORBIDDEN", message: "You can only remove your own acknowledgements." });
  }
  ack.deleteOne();
  await req.card.save();
  await req.card.populate(POPULATE_FIELDS);
  res.json(toCardJSON(req.card));
}

module.exports = {
  listForProject, get, create, update, remove, reorder,
  addTask, updateTask, removeTask,
  addLink, removeLink,
  addNote, removeNote,
  addAcknowledgement, removeAcknowledgement,
  toCardJSON,
};
