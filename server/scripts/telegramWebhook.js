import "dotenv/config";

import {
  setTelegramWebhook,
  getTelegramWebhookInfo,
} from "../src/services/telegramService.js";

try {
  console.log("Registering Telegram webhook...");

  await setTelegramWebhook();

  console.log("Webhook registered successfully!");

  const info = await getTelegramWebhookInfo();

  console.log("Webhook URL:", info.url);
  console.log("Pending updates:", info.pending_update_count);
} catch (error) {
  console.error("Webhook registration failed:", error.message);
  process.exitCode = 1;
}
