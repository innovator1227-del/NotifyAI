import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Rule from "../models/Rule.js";

const fields = ["sender", "message", "platform", "category", "priority"];
const operators = ["contains", "equals", "not_contains"];
const actionTypes = [
  "set_priority",
  "set_category",
  "archive",
  "mark_important",
  "mark_read",
];
const categories = ["Work", "Personal", "Security", "Promotion", "Other"];
const priorities = ["critical", "high", "medium", "low"];

function validateRule(input) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const conditions = Array.isArray(input.conditions) ? input.conditions : [];
  const actions = Array.isArray(input.actions) ? input.actions : [];
  const matchMode = input.matchMode === "any" ? "any" : "all";

  if (!name || name.length > 100) {
    return { error: "Rule name is required and must be 100 characters or fewer." };
  }
  if (!conditions.length || conditions.length > 10) {
    return { error: "Rules need between 1 and 10 conditions." };
  }
  if (!actions.length || actions.length > 5) {
    return { error: "Rules need between 1 and 5 actions." };
  }

  const normalizedConditions = [];
  for (const condition of conditions) {
    if (
      !fields.includes(condition?.field) ||
      !operators.includes(condition?.op) ||
      typeof condition.value !== "string" ||
      !condition.value.trim() ||
      condition.value.length > 200
    ) {
      return { error: "A rule condition contains an invalid field, operator, or value." };
    }
    normalizedConditions.push({
      field: condition.field,
      op: condition.op,
      value: condition.value.trim(),
    });
  }

  const normalizedActions = [];
  for (const action of actions) {
    if (!actionTypes.includes(action?.type)) {
      return { error: "A rule action is invalid." };
    }
    if (
      (action.type === "set_priority" && !priorities.includes(action.value)) ||
      (action.type === "set_category" && !categories.includes(action.value))
    ) {
      return { error: "A rule action has an invalid category or priority." };
    }
    normalizedActions.push({
      type: action.type,
      value: action.value || "",
    });
  }

  return {
    value: {
      name,
      conditions: normalizedConditions,
      actions: normalizedActions,
      matchMode,
      active: input.active !== false,
      rulePriority: Math.max(-100, Math.min(100, Number(input.rulePriority) || 0)),
    },
  };
}

function matchesRule(notification, rule) {
  const comparisons = rule.conditions.map((condition) => {
    const value = {
      sender: notification.senderName,
      message: notification.message,
      platform: notification.platform,
      category: notification.category,
      priority: notification.priority,
    }[condition.field].toLowerCase();
    const expected = condition.value.toLowerCase();

    if (condition.op === "equals") return value === expected;
    const contains = value.includes(expected);
    return condition.op === "contains" ? contains : !contains;
  });
  return rule.matchMode === "any"
    ? comparisons.some(Boolean)
    : comparisons.every(Boolean);
}

function actionEffects(notification, actions) {
  const updated = {};
  for (const action of actions) {
    switch (action.type) {
      case "set_priority":
        if (!notification.userOverride?.priority) updated.priority = action.value;
        break;
      case "set_category":
        if (!notification.userOverride?.category) updated.category = action.value;
        break;
      case "archive":
        updated.archivedStatus = true;
        break;
      case "mark_important":
        updated.isImportant = true;
        break;
      case "mark_read":
        updated.readStatus = true;
        break;
    }
  }
  return updated;
}

export async function listRules(req, res) {
  const rules = await Rule.find({ user: req.userId }).sort({
    rulePriority: -1,
    createdAt: -1,
  });
  res.json({ rules });
}

export async function createRule(req, res) {
  const validation = validateRule(req.body || {});
  if (validation.error) return res.status(400).json({ message: validation.error });
  const rule = await Rule.create({ user: req.userId, ...validation.value });
  res.status(201).json({ rule });
}

export async function updateRule(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid rule id." });
  }
  const current = await Rule.findOne({ _id: req.params.id, user: req.userId });
  if (!current) return res.status(404).json({ message: "Rule not found." });
  const validation = validateRule({ ...current.toObject(), ...req.body });
  if (validation.error) return res.status(400).json({ message: validation.error });
  Object.assign(current, validation.value);
  await current.save();
  res.json({ rule: current });
}

export async function deleteRule(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid rule id." });
  }
  const rule = await Rule.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!rule) return res.status(404).json({ message: "Rule not found." });
  res.json({ success: true });
}

export async function previewRule(req, res) {
  const validation = validateRule(req.body || {});
  if (validation.error) return res.status(400).json({ message: validation.error });
  const notifications = await Notification.find({
    user: req.userId,
    archivedStatus: false,
  })
    .sort({ receivedAt: -1 })
    .limit(1000);
  const matched = notifications.filter((notification) =>
    matchesRule(notification, validation.value),
  );
  const effects = matched.reduce((totals, notification) => {
    for (const action of validation.value.actions) {
      const effect = action.type;
      totals[effect] = (totals[effect] || 0) + 1;
    }
    return totals;
  }, {});
  res.json({
    count: matched.length,
    effects,
    sample: matched.slice(0, 8),
  });
}

export async function applyRule(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid rule id." });
  }
  const rule = await Rule.findOne({ _id: req.params.id, user: req.userId });
  if (!rule) return res.status(404).json({ message: "Rule not found." });
  if (!rule.active) return res.status(400).json({ message: "Enable the rule before applying it." });
  const notifications = await Notification.find({
    user: req.userId,
    archivedStatus: false,
  })
    .sort({ importanceScore: -1, receivedAt: -1 })
    .limit(1000);
  const updates = notifications
    .filter((notification) => matchesRule(notification, rule))
    .map((notification) => ({
      updateOne: {
        filter: { _id: notification._id, user: req.userId },
        update: { $set: actionEffects(notification, rule.actions) },
      },
    }));

  if (updates.length) await Notification.bulkWrite(updates);
  rule.lastRunAt = new Date();
  await rule.save();
  res.json({ updated: updates.length });
}
