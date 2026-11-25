import mongoose from "mongoose";
const telegramConnectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Telegram chat ID is stored as a string to avoid numeric issues.
    chatId: {
      type: String,
      default: undefined,
    },

    telegramUserId: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      default: "",
    },

    firstName: {
      type: String,
      default: "",
    },

    chatType: {
      type: String,
      default: "private",
    },

    linkTokenHash: {
      type: String,
      default: undefined,
    },

    linkExpiresAt: {
      type: Date,
      default: undefined,
    },

    linkedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// One Telegram chat can belong to only one NotifyAI account.
telegramConnectionSchema.index(
  { chatId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      chatId: { $type: "string" },
    },
  },
);

export default mongoose.model("TelegramConnection", telegramConnectionSchema);
