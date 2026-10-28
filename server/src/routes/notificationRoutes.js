import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  bulkUpdateNotifications, listNotifications, createNotification, updateNotification, deleteNotification, notificationStats,
} from "../controllers/notificationController.js";
const router = Router();
router.use(authMiddleware);
router.get("/stats", notificationStats);
router.patch("/bulk", bulkUpdateNotifications);
router.get("/", listNotifications);
router.post("/", createNotification);
router.patch("/:id", updateNotification);
router.delete("/:id", deleteNotification);
export default router;
