import { Router } from "express";
import {
  getTeams,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} from "../controllers/team.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/scope.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", getTeams);
router.post("/", requireRoles(Role.SUPER_ADMIN, Role.MANAGER), createTeam);
router.put("/:id", requireRoles(Role.SUPER_ADMIN, Role.MANAGER), updateTeam);
router.post("/:id/members", requireRoles(Role.SUPER_ADMIN, Role.MANAGER, Role.TEAM_LEAD), addTeamMember);
router.delete("/:id/members/:userId", requireRoles(Role.SUPER_ADMIN, Role.MANAGER, Role.TEAM_LEAD), removeTeamMember);

export default router;
