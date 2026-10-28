import mongoose from "mongoose";

const digestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    period: { type: String, required: true, trim: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    notificationCount: { type: Number, min: 0, required: true },
    summary: { type: String, required: true, trim: true },
    highlights: {
      type: [{ title: { type: String, required: true }, detail: { type: String, default: "" } }],
      default: [],
    },
    nextActions: { type: [String], default: [] },
    source: { type: String, enum: ["ai", "rules"], default: "ai" },
  },
  { timestamps: true },
);

digestSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Digest", digestSchema);
