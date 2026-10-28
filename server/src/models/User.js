import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  preferences: {
    importantCategories: { type: [String], default: ["Security", "Work"] },
    importantContacts: { type: [String], default: [] },
    priorityThreshold: { type: Number, min: 0, max: 100, default: 60 },
    aiEnabled: { type: Boolean, default: true },
    autoAnalyze: { type: Boolean, default: false },
    quietHoursEnabled: { type: Boolean, default: false },
    quietStart: { type: String, default: "22:00" },
    quietEnd: { type: String, default: "08:00" },
    digestFrequency: { type: String, enum: ["never", "daily", "weekly"], default: "daily" },
  },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
