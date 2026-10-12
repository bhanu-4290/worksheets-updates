import { Router } from "express";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} from "../controllers/department.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", requireRoles(Role.SUPER_ADMIN), createDepartment);
router.put("/:id", requireRoles(Role.SUPER_ADMIN), updateDepartment);

export default router;
