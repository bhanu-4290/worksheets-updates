import { Router } from "express";
import {
  getDashboardKpi,
  getComplianceReport,
  exportReportCsv,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", getDashboardKpi);
router.get("/compliance", getComplianceReport);
router.get("/export", exportReportCsv);

export default router;
