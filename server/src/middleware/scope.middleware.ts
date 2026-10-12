import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "./auth.middleware.js";
import { prisma } from "../config/db.js";

export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.role === Role.SUPER_ADMIN;
}

export function isManager(user: AuthenticatedUser): boolean {
  return user.role === Role.MANAGER;
}

export function isTeamLead(user: AuthenticatedUser): boolean {
  return user.role === Role.TEAM_LEAD;
}

export function canAccessDepartment(user: AuthenticatedUser, departmentId: string): boolean {
  if (isSuperAdmin(user)) return true;
  if (user.managedDepartmentIds.includes(departmentId)) return true;
  return user.departmentId === departmentId;
}

export async function canAccessTeam(user: AuthenticatedUser, teamId: string): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (user.ledTeamIds.includes(teamId)) return true;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { departmentId: true },
  });

  if (!team) return false;

  if (isManager(user)) {
    return user.managedDepartmentIds.includes(team.departmentId) || user.departmentId === team.departmentId;
  }

  if (user.membershipTeamIds.includes(teamId)) return true;

  return false;
}

export async function canAccessEmployee(user: AuthenticatedUser, targetUserId: string): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (user.id === targetUserId) return true;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      teamMemberships: { select: { teamId: true } },
    },
  });

  if (!target) return false;

  if (isManager(user)) {
    // Manager can access if employee is in manager's department or reports to manager
    const inManagedDept = target.departmentId && (user.managedDepartmentIds.includes(target.departmentId) || user.departmentId === target.departmentId);
    const reportsToManager = target.managerId === user.id;
    return !!(inManagedDept || reportsToManager);
  }

  if (isTeamLead(user)) {
    // Team lead can access if employee's assigned team lead is user or in one of user's led teams
    if (target.teamLeadId === user.id) return true;
    const hasSharedLedTeam = target.teamMemberships.some((m) => user.ledTeamIds.includes(m.teamId));
    return hasSharedLedTeam;
  }

  // Executive cannot access another employee's private records
  return false;
}
