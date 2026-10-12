import { Router } from "express";
import {
  getReviewQueue,
  approveReport,
  requestRevision,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/queue", requireRoles(Role.SUPER_ADMIN, Role.MANAGER, Role.TEAM_LEAD), getReviewQueue);
router.post("/:reportId/approve", requireRoles(Role.SUPER_ADMIN, Role.TEAM_LEAD), approveReport);
router.post("/:reportId/request-revision", requireRoles(Role.SUPER_ADMIN, Role.TEAM_LEAD), requestRevision);

export default router;
