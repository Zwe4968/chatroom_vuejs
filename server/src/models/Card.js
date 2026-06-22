const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const linkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const acknowledgementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["approve", "confirm", "review", "completed"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }],
  status: { type: String, enum: ["todo", "in_progress", "review", "completed"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dueDate: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  position: { type: Number, required: true, default: 0 },
  tasks: { type: [taskSchema], default: [] },
  links: { type: [linkSchema], default: [] },
  notes: { type: [noteSchema], default: [] },
  acknowledgements: { type: [acknowledgementSchema], default: [] },
}, { timestamps: true });

cardSchema.index({ projectIds: 1, status: 1, position: 1 });
cardSchema.index({ assignees: 1 });

module.exports = mongoose.model("Card", cardSchema);
