import { Router } from "express";
import {
  getEscalations,
  createEscalation,
  updateEscalation,
} from "../controllers/escalation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getEscalations);
router.post("/", createEscalation);
router.patch("/:id/resolve", updateEscalation);

export default router;
