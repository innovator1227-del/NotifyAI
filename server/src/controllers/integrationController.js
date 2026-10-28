import Integration from "../models/Integration.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { applyUserPreferences, triageNotification } from "../services/aiService.js";

const demoMessages = {
  Facebook: [
    {
      senderName: "Facebook Security",
      senderUsername: "security",
      message: "A new sign-in was detected for your account. Review it if it wasn't you.",
      category: "Security",
      priority: "critical",
    },
  ],
  Instagram: [
    {
      senderName: "Mekdes Alemu",
      senderUsername: "mekdesalemu",
      message: "Mentioned you in a comment: Love the latest project update!",
      category: "Personal",
      priority: "medium",
    },
    {
      senderName: "Studio North",
      senderUsername: "studionorth",
      message: "Your work application has been viewed by the hiring team.",
      category: "Work",
      priority: "high",
    },
  ],
  X: [
    {
      senderName: "NotifyAI Updates",
      senderUsername: "notifyai",
      message: "A new product update is available. Read the release notes.",
      category: "Work",
      priority: "low",
    },
  ],
  LinkedIn: [
    {
      senderName: "Recruiting Team",
      senderUsername: "recruiting",
      message: "The team would like to schedule an interview this week.",
      category: "Work",
      priority: "high",
    },
  ],
  YouTube: [
    {
      senderName: "NotifyAI Tutorials",
      senderUsername: "notifyai",
      message: "A new tutorial about organizing your workflow is available.",
      category: "Personal",
      priority: "low",
    },
  ],
  Telegram: [
    {
      senderName: "Project Team",
      senderUsername: "project-team",
      message: "The project review meeting starts in 30 minutes.",
      category: "Work",
      priority: "high",
    },
  ],
  Demo: [
    {
      senderName: "NotifyAI Demo",
      senderUsername: "demo",
      message: "Welcome. Your demo notifications are ready to explore.",
      category: "Other",
      priority: "medium",
    },
  ],
};

const allowedProviders = Object.keys(demoMessages);

export async function listIntegrations(req, res) {
  const integrations = await Integration.find({ user: req.userId }).sort({ provider: 1 });
  res.json({ integrations, providers: allowedProviders });
}

export async function syncDemoProvider(req, res) {
  const { provider } = req.body || {};
  if (!allowedProviders.includes(provider)) {
    return res.status(400).json({ message: "Choose a supported demo provider." });
  }

  const batch = demoMessages[provider];
  const results = await Promise.all(
    batch.map((item, index) =>
      Notification.updateOne(
        {
          user: req.userId,
          platform: provider === "Demo" ? "Other" : provider,
          externalNotificationId: `demo-${provider.toLowerCase()}-${index + 1}`,
        },
        {
          $setOnInsert: {
            ...item,
            user: req.userId,
            platform: provider === "Demo" ? "Other" : provider,
            externalNotificationId: `demo-${provider.toLowerCase()}-${index + 1}`,
            isSeed: true,
          },
        },
        { upsert: true },
      ),
    ),
  );
  const imported = results.filter((result) => result.upsertedCount > 0).length;
  const user = await User.findById(req.userId).select("preferences");
  let analysisError;
  if (user?.preferences.autoAnalyze && imported) {
    try {
      const insertedIds = results.flatMap((result) =>
        result.upsertedId ? [result.upsertedId] : [],
      );
      const notifications = await Notification.find({
        _id: { $in: insertedIds },
        user: req.userId,
      });
      const analyses = await Promise.all(
        notifications.map(async (notification) => ({
          notification,
          result: applyUserPreferences(
            notification,
            await triageNotification(notification, {
              forceRules: !user.preferences.aiEnabled,
              preferences: user.preferences,
            }),
            user.preferences,
          ),
        })),
      );
      await Notification.bulkWrite(
        analyses.map(({ notification, result }) => ({
          updateOne: {
            filter: { _id: notification._id, user: req.userId },
            update: { $set: { ...result, analyzedAt: new Date() } },
          },
        })),
      );
    } catch (error) {
      console.error("Automatic demo notification analysis failed:", error.message);
      analysisError = "Notifications were imported, but automatic analysis failed.";
    }
  }
  const integration = await Integration.findOneAndUpdate(
    { user: req.userId, provider },
    {
      $set: { status: "connected", isDemo: true, lastSyncAt: new Date(), error: "" },
    },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ imported, integration, analysisError });
}
