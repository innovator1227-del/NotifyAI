import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  matchMode: { type: String, enum: ["all", "any"], default: "all" },
  conditions: {
    type: [{
      field: { type: String, enum: ["sender", "message", "platform", "category", "priority"], required: true },
      op: { type: String, enum: ["contains", "equals", "not_contains"], required: true },
      value: { type: String, required: true, trim: true },
    }],
    default: [],
  },
  actions: {
    type: [{
      type: { type: String, enum: ["set_priority", "set_category", "archive", "mark_important", "mark_read"], required: true },
      value: { type: String, default: "" },
    }],
    default: [],
  },
  rulePriority: { type: Number, default: 0 },
  lastRunAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Rule", ruleSchema);
