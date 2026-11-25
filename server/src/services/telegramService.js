const TELEGRAM_API = "https://api.telegram.org";

export async function telegramRequest(method, payload = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error: ${method}`);
  }

  return data.result;
}

export async function sendTelegramMessage(chatId, text) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export async function setTelegramWebhook() {
  const publicUrl = process.env.SERVER_PUBLIC_URL?.replace(/\/+$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!publicUrl || !publicUrl.startsWith("https://")) {
    throw new Error("SERVER_PUBLIC_URL must be a public HTTPS URL");
  }

  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    throw new Error("Invalid TELEGRAM_WEBHOOK_SECRET");
  }

  return telegramRequest("setWebhook", {
    url: `${publicUrl}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: false,
  });
}

export async function getTelegramWebhookInfo() {
  return telegramRequest("getWebhookInfo");
}
