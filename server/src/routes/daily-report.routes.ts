import { Router } from "express";
import {
  getDailyReports,
  getTodayReport,
  getDailyReportById,
  saveDailyReport,
  resubmitReport,
} from "../controllers/daily-report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getDailyReports);
router.get("/today", getTodayReport);
router.get("/:id", getDailyReportById);
router.post("/", saveDailyReport);
router.post("/:id/resubmit", resubmitReport);

export default router;
