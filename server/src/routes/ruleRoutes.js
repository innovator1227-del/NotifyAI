import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  applyRule,
  createRule,
  deleteRule,
  listRules,
  previewRule,
  updateRule,
} from "../controllers/ruleController.js";

const router = Router();
router.use(authMiddleware);
router.get("/", listRules);
router.post("/", createRule);
router.post("/preview", previewRule);
router.post("/:id/apply", applyRule);
router.patch("/:id", updateRule);
router.delete("/:id", deleteRule);

export default router;
