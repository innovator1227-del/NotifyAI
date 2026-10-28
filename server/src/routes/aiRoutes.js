import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  classify,
  createDigest,
  listDigests,
  search,
  status,
  triageInbox,
} from "../controllers/aiController.js";
const router = Router();
router.use(authMiddleware);
router.get("/status", status);
router.post("/classify", classify);
router.post("/triage", triageInbox);
router.post("/search", search);
router.get("/digests", listDigests);
router.post("/digests", createDigest);
export default router;
