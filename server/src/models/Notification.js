import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  platform: { type: String, enum: ["Facebook", "Instagram", "X", "LinkedIn", "YouTube", "Telegram", "Other"], default: "Other" },
  senderName: { type: String, required: true, trim: true },
  senderUsername: { type: String, default: "" },
  message: { type: String, required: true, trim: true },
  externalNotificationId: { type: String, default: undefined },
  isSeed: { type: Boolean, default: false },
  category: { type: String, enum: ["Work", "Personal", "Security", "Promotion", "Other"], default: "Other" },
  priority: { type: String, enum: ["critical", "high", "medium", "low"], default: "medium" },
  importanceScore: { type: Number, min: 0, max: 100, default: 50 },
  reason: { type: String, default: "" },
  summary: { type: String, default: "" },
  suggestedAction: { type: String, default: "" },
  isSpam: { type: Boolean, default: false },
  aiSource: { type: String, enum: ["ai", "rules", "manual", ""], default: "" },
  analyzedAt: { type: Date, default: null },
  userOverride: {
    category: { type: Boolean, default: false },
    priority: { type: Boolean, default: false },
  },
  readStatus: { type: Boolean, default: false },
  archivedStatus: { type: Boolean, default: false },
  isImportant: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

notificationSchema.index({ user: 1, receivedAt: -1 });
notificationSchema.index(
  { user: 1, platform: 1, externalNotificationId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalNotificationId: { $type: "string" } },
  },
);
export default mongoose.model("Notification", notificationSchema);
