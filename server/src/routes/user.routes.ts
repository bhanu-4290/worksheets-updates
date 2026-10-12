import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  importUsersCsv,
  exportUsersCsv,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", getUsers);
router.get("/export-csv", exportUsersCsv);
router.get("/:id", getUserById);
router.post("/", requireRoles(Role.SUPER_ADMIN), createUser);
router.put("/:id", requireRoles(Role.SUPER_ADMIN), updateUser);
router.patch("/:id/status", requireRoles(Role.SUPER_ADMIN), toggleUserStatus);
router.post("/import-csv", requireRoles(Role.SUPER_ADMIN), importUsersCsv);

export default router;
