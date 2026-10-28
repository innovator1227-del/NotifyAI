import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["Facebook", "Instagram", "X", "LinkedIn", "YouTube", "Telegram", "Demo"], required: true },
  status: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
  isDemo: { type: Boolean, default: false },
  lastSyncAt: { type: Date, default: null },
  error: { type: String, default: "" },
}, { timestamps: true });

integrationSchema.index({ user: 1, provider: 1 }, { unique: true });
export default mongoose.model("Integration", integrationSchema);
