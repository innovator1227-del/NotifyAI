import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createTelegramLink,
  getTelegramStatus,
  disconnectTelegram,
  handleTelegramWebhook,
} from "../controllers/telegramController.js";

const router = Router();

// Public route: Telegram calls this endpoint.
router.post("/webhook", handleTelegramWebhook);

// Protected routes: NotifyAI users call these endpoints.
router.post("/connect", authMiddleware, createTelegramLink);
router.get("/status", authMiddleware, getTelegramStatus);
router.delete("/disconnect", authMiddleware, disconnectTelegram);

export default router;
