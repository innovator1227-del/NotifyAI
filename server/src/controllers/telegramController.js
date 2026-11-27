import crypto from "crypto";
import TelegramConnection from "../models/TelegramConnection.js";
import Notification from "../models/Notification.js";
import { sendTelegramMessage } from "../services/telegramService.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Generate a temporary Telegram connection link.

const createTelegramLink = async (req, res, next) => {
  try {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");

    if (!botUsername) {
      return res.status(500).json({
        message: "TELEGRAM_BOT_USERNAME is not configured",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await TelegramConnection.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
          linkTokenHash: tokenHash,
          linkExpiresAt: expiresAt,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return res.json({
      success: true,
      message: "Telegram connection link generated",
      deepLink,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// Return current user's Telegram connection status.
const getTelegramStatus = async (req, res, next) => {
  try {
    const connection = await TelegramConnection.findOne({
      user: req.userId,
    }).select("chatId username firstName linkedAt");

    return res.json({
      success: true,
      connected: Boolean(connection?.chatId),
      connection: connection?.chatId
        ? {
            username: connection.username,
            firstName: connection.firstName,
            linkedAt: connection.linkedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// Disconnect only the authenticated user's Telegram account.
const disconnectTelegram = async (req, res, next) => {
  try {
    await TelegramConnection.deleteOne({
      user: req.userId,
    });

    return res.json({
      success: true,
      message: "Telegram disconnected successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getMessageContent = (message) => {
  if (message.text) return message.text;
  if (message.caption) return message.caption;

  const mediaTypes = [
    "photo",
    "video",
    "document",
    "voice",
    "audio",
    "sticker",
    "animation",
    "location",
    "contact",
    "video_note",
  ];

  const mediaType = mediaTypes.find((type) => message[type]);

  return mediaType ? `[Telegram ${mediaType} message]` : "";
};

const getSenderName = (message) => {
  const from = message.from;

  if (!from) {
    return message.chat?.title || "Telegram user";
  }

  return (
    [from.first_name, from.last_name].filter(Boolean).join(" ") ||
    "Telegram user"
  );
};

const isStartCommand = (text = "") => {
  return /^\/start(?:@\w+)?(?:\s|$)/i.test(text);
};

// Handle /start and connect Telegram to a NotifyAI account.
const handleStartCommand = async (message) => {
  const text = message.text || "";
  const match = text.match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]+))?/i);
  const token = match?.[1];

  if (!token) {
    await sendTelegramMessage(
      message.chat.id,
      "Welcome to NotifyAI! Open the Telegram connection link from your NotifyAI dashboard to connect your account.",
    );
    return;
  }

  const connection = await TelegramConnection.findOneAndUpdate(
    {
      linkTokenHash: hashToken(token),
      linkExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        chatId: String(message.chat.id),
        telegramUserId: String(message.from.id),
        username: message.from.username || "",
        firstName: message.from.first_name || "",
        chatType: message.chat.type,
        linkedAt: new Date(),
      },
      $unset: {
        linkTokenHash: "",
        linkExpiresAt: "",
      },
    },
    {
      new: true,
    },
  );

  if (!connection) {
    await sendTelegramMessage(
      message.chat.id,
      "This connection link is invalid or expired. Please generate a new link from your NotifyAI dashboard.",
    );
    return;
  }

  await sendTelegramMessage(
    message.chat.id,
    "Your Telegram account is now connected to NotifyAI! You can send or forward messages to this bot, and they will appear in your NotifyAI inbox.",
  );
};

// Public endpoint called by Telegram.
const handleTelegramWebhook = async (req, res) => {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const receivedSecret = req.headers["x-telegram-bot-api-secret-token"] || "";

  const expectedBuffer = Buffer.from(expectedSecret);
  const receivedBuffer = Buffer.from(receivedSecret);

  const validSecret =
    expectedSecret.length > 0 &&
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!validSecret) {
    return res.status(401).json({
      message: "Invalid Telegram webhook secret",
    });
  }

  try {
    const update = req.body;

    if (!Number.isInteger(update?.update_id)) {
      return res.status(400).json({
        message: "Invalid Telegram update",
      });
    }

    const message = update.message || update.edited_message;

    if (!message || !message.chat || !message.from) {
      return res.sendStatus(200);
    }

    // Account linking must happen in a private Telegram chat.
    if (message.chat.type === "private" && isStartCommand(message.text)) {
      await handleStartCommand(message);
      return res.sendStatus(200);
    }

    // Ignore messages sent by bots.
    if (message.from.is_bot) {
      return res.sendStatus(200);
    }

    // Only collect messages from a linked Telegram chat.
    const connection = await TelegramConnection.findOne({
      chatId: String(message.chat.id),
    });

    if (!connection) {
      return res.sendStatus(200);
    }

    const content = getMessageContent(message);

    if (!content) {
      return res.sendStatus(200);
    }

    const senderName = getSenderName(message);

    try {
      await Notification.create({
        user: connection.user,
        platform: "Telegram",
        senderName,
        senderUsername: message.from.username
          ? `@${message.from.username}`
          : "",
        message: content.slice(0, 5000),
        externalNotificationId: String(update.update_id),
        category: "Other",
        priority: "medium",
        importanceScore: 50,
        aiSource: "",
        readStatus: false,
        archivedStatus: false,
        isImportant: false,
        receivedAt: message.date ? new Date(message.date * 1000) : new Date(),
      });
    } catch (error) {
      // Telegram may resend an update. Ignore duplicate events.
      if (error.code === 11000) {
        return res.sendStatus(200);
      }

      throw error;
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Telegram webhook processing failed:", error);

    // A non-2xx response lets Telegram retry delivery.
    return res.status(500).json({
      message: "Could not process Telegram update",
    });
  }
};

export {
  createTelegramLink,
  getTelegramStatus,
  disconnectTelegram,
  handleTelegramWebhook,
};
