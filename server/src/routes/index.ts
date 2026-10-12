import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import departmentRoutes from "./department.routes.js";
import teamRoutes from "./team.routes.js";
import projectRoutes from "./project.routes.js";
import taskRoutes from "./task.routes.js";
import dailyReportRoutes from "./daily-report.routes.js";
import reviewRoutes from "./review.routes.js";
import escalationRoutes from "./escalation.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import notificationRoutes from "./notification.routes.js";
import settingsRoutes from "./settings.routes.js";
import auditRoutes from "./audit.routes.js";
import chatRoutes from "./chat.routes.js";
import announcementRoutes from "./announcement.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/teams", teamRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/daily-reports", dailyReportRoutes);
router.use("/reviews", reviewRoutes);
router.use("/escalations", escalationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/chat", chatRoutes);
router.use("/announcements", announcementRoutes);

export default router;
