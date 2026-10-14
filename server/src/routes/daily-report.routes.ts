import { Router } from "express";
import {
  getDailyReports,
  getTodayReport,
  getDailyReportById,
  saveDailyReport,
  resubmitReport,
  exportDailyReports,
  getDailyReportsSummary,
  getDateSubmissionsAudit,
} from "../controllers/daily-report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getDailyReports);
router.get("/today", getTodayReport);
router.get("/export", exportDailyReports);
router.get("/summary", getDailyReportsSummary);
router.get("/date-audit", getDateSubmissionsAudit);
router.get("/:id", getDailyReportById);
router.post("/", saveDailyReport);
router.post("/:id/resubmit", resubmitReport);

export default router;
