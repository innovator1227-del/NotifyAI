import Digest from "../models/Digest.js";
import Integration from "../models/Integration.js";
import Notification from "../models/Notification.js";
import Rule from "../models/Rule.js";
import User from "../models/User.js";

const preferenceFields = [
  "importantCategories",
  "importantContacts",
  "priorityThreshold",
  "aiEnabled",
  "autoAnalyze",
  "quietHoursEnabled",
  "quietStart",
  "quietEnd",
  "digestFrequency",
];
const categories = ["Work", "Personal", "Security", "Promotion", "Other"];
const frequencies = ["never", "daily", "weekly"];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function getSettings(req, res) {
  const user = await User.findById(req.userId).select("preferences");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ preferences: user.preferences });
}

export async function updateSettings(req, res) {
  const updates = req.body || {};
  const preferences = {};
  for (const [key, value] of Object.entries(updates)) {
    if (!preferenceFields.includes(key)) {
      return res.status(400).json({ message: `Unknown preference: ${key}.` });
    }
    if (key === "importantCategories") {
      if (!Array.isArray(value) || value.some((entry) => !categories.includes(entry))) {
        return res.status(400).json({ message: "Important categories are invalid." });
      }
    } else if (key === "importantContacts") {
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((entry) => typeof entry !== "string" || entry.trim().length > 100)
      ) {
        return res.status(400).json({ message: "Important contacts are invalid." });
      }
      preferences[key] = value.map((entry) => entry.trim());
      continue;
    } else if (key === "priorityThreshold") {
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return res.status(400).json({ message: "Priority threshold must be between 0 and 100." });
      }
    } else if (key === "digestFrequency") {
      if (!frequencies.includes(value)) {
        return res.status(400).json({ message: "Digest frequency is invalid." });
      }
    } else if (key === "quietStart" || key === "quietEnd") {
      if (typeof value !== "string" || !timePattern.test(value)) {
        return res.status(400).json({ message: "Quiet-hour times must use HH:MM." });
      }
    } else if (typeof value !== "boolean") {
      return res.status(400).json({ message: `${key} must be a boolean.` });
    }
    preferences[key] = value;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value])) },
    { new: true, runValidators: true },
  ).select("preferences");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ preferences: user.preferences });
}

export async function exportUserData(req, res) {
  const [user, notifications, rules, integrations, digests] = await Promise.all([
    User.findById(req.userId).select("-password"),
    Notification.find({ user: req.userId }).sort({ receivedAt: -1 }).limit(5000),
    Rule.find({ user: req.userId }).sort({ rulePriority: -1 }),
    Integration.find({ user: req.userId }).sort({ provider: 1 }),
    Digest.find({ user: req.userId }).sort({ createdAt: -1 }).limit(1000),
  ]);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({
    exportedAt: new Date().toISOString(),
    profile: { id: user._id, name: user.name, email: user.email },
    preferences: user.preferences,
    notifications,
    rules,
    integrations,
    digests,
  });
}
