import Notification from "../models/Notification.js";
import Digest from "../models/Digest.js";
import User from "../models/User.js";
import {
  applyUserPreferences,
  getAiStatus,
  searchNotifications,
  summarizeNotifications,
  triageNotification,
} from "../services/aiService.js";

export async function classify(req, res) {
  const { senderName, message, platform } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "message is required" });
  }
  const result = await triageNotification({
    senderName: typeof senderName === "string" ? senderName : "Unknown sender",
    message: message.trim().slice(0, 4000),
    platform: typeof platform === "string" ? platform : "Other",
  });
  res.json({ result });
}

export async function status(req, res) {
  const user = await User.findById(req.userId).select("preferences.aiEnabled");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({
    ...getAiStatus(),
    enabled: user.preferences.aiEnabled,
  });
}

export async function triageInbox(req, res) {
  const limit = Math.min(Math.max(Number(req.body?.limit) || 25, 1), 25);
  const [user, notifications] = await Promise.all([
    User.findById(req.userId).select("preferences"),
    Notification.find({ user: req.userId, archivedStatus: false })
      .sort({ receivedAt: -1 })
      .limit(limit),
  ]);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (!notifications.length) {
    return res.json({ updated: [], count: 0 });
  }

  const classifications = await Promise.all(
    notifications.map(async (notification) => {
      const result = await triageNotification(notification, {
        forceRules: !user.preferences.aiEnabled,
        preferences: user.preferences,
      });
      return {
        notification,
        result: applyUserPreferences(notification, result, user.preferences),
      };
    }),
  );
  await Notification.bulkWrite(
    classifications.map(({ notification, result }) => ({
      updateOne: {
        filter: { _id: notification._id, user: req.userId },
        update: {
          $set: {
            ...result,
            analyzedAt: new Date(),
          },
        },
      },
    })),
  );

  res.json({
    count: classifications.length,
    source: classifications.every(({ result }) => result.aiSource === "ai")
      ? "ai"
      : "rules",
    updated: classifications.map(({ notification, result }) => ({
      ...notification.toObject(),
      ...result,
      analyzedAt: new Date(),
    })),
  });
}

export async function search(req, res) {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  if (!query) return res.status(400).json({ message: "query is required" });
  if (query.length > 240) {
    return res.status(400).json({ message: "query must be 240 characters or fewer" });
  }

  const [user, notifications] = await Promise.all([
    User.findById(req.userId).select("preferences.aiEnabled"),
    Notification.find({ user: req.userId, archivedStatus: false })
      .sort({ receivedAt: -1 })
      .limit(100),
  ]);
  if (!user) return res.status(404).json({ message: "User not found." });
  const { filters, source, explanation } = await searchNotifications(
    query,
    notifications,
    { forceRules: !user.preferences.aiEnabled },
  );
  const keywords = filters.keywords.map((keyword) => keyword.toLowerCase());
  const since = filters.days
    ? new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000)
    : null;
  const rows = notifications
    .filter((notification) => {
      if (filters.unread_only && notification.readStatus) return false;
      if (since && notification.receivedAt < since) return false;
      if (filters.categories.length && !filters.categories.includes(notification.category)) return false;
      if (filters.priorities.length && !filters.priorities.includes(notification.priority)) return false;
      if (filters.platforms.length && !filters.platforms.includes(notification.platform)) return false;
      if (keywords.length) {
        const text = `${notification.senderName} ${notification.senderUsername} ${notification.message}`.toLowerCase();
        if (!keywords.some((keyword) => text.includes(keyword))) return false;
      }
      return true;
    })
    .sort((left, right) => right.importanceScore - left.importanceScore)
    .slice(0, 50);
  res.json({
    filters,
    source,
    explanation,
    rows,
  });
}

export async function createDigest(req, res) {
  const requestedHours = req.body?.hours === undefined ? 24 : Number(req.body.hours);
  if (!Number.isInteger(requestedHours) || requestedHours < 1 || requestedHours > 744) {
    return res.status(400).json({ message: "hours must be an integer from 1 to 744." });
  }
  const hours = requestedHours;
  const period = `${hours} hours`;
  const start = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [user, notifications] = await Promise.all([
  User.findById(req.userId).select("preferences.aiEnabled"),
  Notification.find({
    user: req.userId,
    archivedStatus: false,
    isSpam: false,
    receivedAt: { $gte: start },
  })
    .sort({ importanceScore: -1, receivedAt: -1 })
    .limit(60),
  ]);
  if (!user) return res.status(404).json({ message: "User not found." });
  if (!notifications.length) {
    return res.status(400).json({
      message: `No unarchived notifications were received in the last ${period}.`,
    });
  }

  const result = await summarizeNotifications(notifications, period, {
    forceRules: !user.preferences.aiEnabled,
  });
  const digest = await Digest.create({
    user: req.userId,
    period,
    periodStart: start,
    periodEnd: new Date(),
    notificationCount: notifications.length,
    ...result,
  });
  res.status(201).json({ ok: true, digest });
}

export async function listDigests(req, res) {
  const digests = await Digest.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ digests });
}
