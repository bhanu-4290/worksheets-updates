import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", requireRoles(Role.SUPER_ADMIN), getAuditLogs);

export default router;
