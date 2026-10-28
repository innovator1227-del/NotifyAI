import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  exportUserData,
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";

const router = Router();
router.use(authMiddleware);
router.get("/", getSettings);
router.patch("/", updateSettings);
router.get("/export", exportUserData);

export default router;
