import { Router } from "express";
import {
  getSettings,
  updateSettings,
  addHoliday,
  deleteHoliday,
} from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", getSettings);
router.put("/", requireRoles(Role.SUPER_ADMIN), updateSettings);
router.post("/holidays", requireRoles(Role.SUPER_ADMIN), addHoliday);
router.delete("/holidays/:id", requireRoles(Role.SUPER_ADMIN), deleteHoliday);

export default router;
