import { Router } from "express";
import { getProjects, createProject, updateProject } from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.post("/", requireRoles(Role.SUPER_ADMIN, Role.MANAGER), createProject);
router.put("/:id", requireRoles(Role.SUPER_ADMIN, Role.MANAGER), updateProject);

export default router;
