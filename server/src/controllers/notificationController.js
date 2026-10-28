import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { applyUserPreferences, triageNotification } from "../services/aiService.js";
import mongoose from "mongoose";

export async function listNotifications(req, res) {
  const {
    q,
    platform,
    category,
    priority,
    from,
    sort = "newest",
    status = "all",
    page = 0,
    limit = 20,
  } = req.query;
  if (!["all", "unread", "read", "important", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid notification status." });
  }
  const filter = { user: req.userId };
  if (status === "archived") filter.archivedStatus = true;
  else {
    filter.archivedStatus = false;
    if (status === "unread") filter.readStatus = false;
    if (status === "read") filter.readStatus = true;
    if (status === "important") filter.isImportant = true;
  }
  if (platform) filter.platform = platform;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (from) {
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid notification start date." });
    }
    filter.receivedAt = { $gte: start };
  }
  if (q) filter.$or = [
    { message: { $regex: escapeRegex(q), $options: "i" } },
    { senderName: { $regex: escapeRegex(q), $options: "i" } },
    { senderUsername: { $regex: escapeRegex(q), $options: "i" } },
  ];
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 0, 0);
  const sortOrder = {
    newest: { receivedAt: -1 },
    oldest: { receivedAt: 1 },
    priority: { importanceScore: -1, receivedAt: -1 },
    relevance: { importanceScore: -1, receivedAt: -1 },
  }[sort];
  if (!sortOrder) return res.status(400).json({ message: "Invalid notification sort order." });
  const [rows, count] = await Promise.all([
    Notification.find(filter).sort(sortOrder).skip(safePage * safeLimit).limit(safeLimit),
    Notification.countDocuments(filter),
  ]);
  res.json({ rows, count, page: safePage, limit: safeLimit });
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const platforms = ["Facebook", "Instagram", "X", "LinkedIn", "YouTube", "Telegram", "Other"];
const categories = ["Work", "Personal", "Security", "Promotion", "Other"];
const priorities = ["critical", "high", "medium", "low"];

export async function createNotification(req, res) {
  const { platform, senderName, senderUsername, message, category, priority } = req.body || {};
  if (
    typeof senderName !== "string" ||
    !senderName.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return res.status(400).json({ message: "senderName and message are required" });
  }
  if (senderName.length > 120 || message.length > 4000) {
    return res.status(400).json({ message: "Sender or message exceeds the allowed length." });
  }
  if (platform !== undefined && !platforms.includes(platform)) {
    return res.status(400).json({ message: "Unsupported notification platform." });
  }
  if (category !== undefined && !categories.includes(category)) {
    return res.status(400).json({ message: "Unsupported notification category." });
  }
  if (priority !== undefined && !priorities.includes(priority)) {
    return res.status(400).json({ message: "Unsupported notification priority." });
  }
  const notification = await Notification.create({
    user: req.userId,
    platform,
    senderName: senderName.trim(),
    senderUsername: typeof senderUsername === "string" ? senderUsername.trim().slice(0, 120) : "",
    message: message.trim(),
    category,
    priority,
  });
  const user = await User.findById(req.userId).select("preferences");
  let analysisError;
  if (user?.preferences.autoAnalyze) {
    try {
      const result = await triageNotification(notification, {
        forceRules: !user.preferences.aiEnabled,
        preferences: user.preferences,
      });
      Object.assign(
        notification,
        applyUserPreferences(notification, result, user.preferences),
        { analyzedAt: new Date() },
      );
      await notification.save();
    } catch (error) {
      console.error("Automatic notification analysis failed:", error.message);
      analysisError = "Notification was saved, but automatic analysis failed.";
    }
  }
  res.status(201).json({ notification, analysisError });
}

export async function updateNotification(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification id." });
  }
  const allowed = ["readStatus", "archivedStatus", "isImportant", "category", "priority"];
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {};
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  for (const key of ["readStatus", "archivedStatus", "isImportant"]) {
    if (Object.hasOwn(update, key) && typeof update[key] !== "boolean") {
      return res.status(400).json({ message: `${key} must be a boolean.` });
    }
  }
  if (Object.hasOwn(update, "category") && !categories.includes(update.category)) {
    return res.status(400).json({ message: "Unsupported notification category." });
  }
  if (Object.hasOwn(update, "priority") && !priorities.includes(update.priority)) {
    return res.status(400).json({ message: "Unsupported notification priority." });
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ message: "No supported notification changes were provided." });
  }
  if (Object.hasOwn(update, "category") || Object.hasOwn(update, "priority")) {
    if (Object.hasOwn(update, "category")) update["userOverride.category"] = true;
    if (Object.hasOwn(update, "priority")) update["userOverride.priority"] = true;
  }
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId }, update, { new: true, runValidators: true },
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json({ notification });
}

export async function deleteNotification(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification id." });
  }
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json({ success: true });
}

export async function bulkUpdateNotifications(req, res) {
  const { ids, patch } = req.body || {};
  const allowed = ["readStatus", "archivedStatus", "isImportant"];
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 100 ||
    ids.some((id) => !mongoose.isValidObjectId(id))
  ) {
    return res.status(400).json({ message: "Provide between 1 and 100 valid notification ids." });
  }
  if (
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch) ||
    Object.keys(patch).length !== 1 ||
    !allowed.includes(Object.keys(patch)[0]) ||
    typeof Object.values(patch)[0] !== "boolean"
  ) {
    return res.status(400).json({ message: "Provide one supported boolean notification update." });
  }
  const result = await Notification.updateMany(
    { user: req.userId, _id: { $in: ids } },
    { $set: patch },
  );
  res.json({ updated: result.modifiedCount });
}

export async function notificationStats(req, res) {
  const rows = await Notification.find({ user: req.userId, archivedStatus: false }).select("readStatus priority category platform isImportant");
  res.json({
    total: rows.length,
    unread: rows.filter((n) => !n.readStatus).length,
    important: rows.filter((n) => n.isImportant).length,
    critical: rows.filter((n) => n.priority === "critical").length,
    byCategory: rows.reduce((acc, n) => ({ ...acc, [n.category]: (acc[n.category] || 0) + 1 }), {}),
    byPlatform: rows.reduce((acc, n) => ({ ...acc, [n.platform]: (acc[n.platform] || 0) + 1 }), {}),
  });
}
