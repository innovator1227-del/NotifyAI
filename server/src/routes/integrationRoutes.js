import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  listIntegrations,
  syncDemoProvider,
} from "../controllers/integrationController.js";

const router = Router();
router.use(authMiddleware);
router.get("/", listIntegrations);
router.post("/sync-demo", syncDemoProvider);

export default router;
