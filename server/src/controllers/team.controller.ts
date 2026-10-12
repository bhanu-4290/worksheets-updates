import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { isSuperAdmin, isManager, isTeamLead, canAccessTeam } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const teamSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(15).toUpperCase(),
  departmentId: z.string().uuid(),
  teamLeadId: z.string().uuid().optional().nullable(),
});

export async function getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { departmentId } = req.query;
    const where: any = {};

    if (isSuperAdmin(user)) {
      if (departmentId) where.departmentId = String(departmentId);
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.departmentId = { in: allowedDepts };
      if (departmentId && allowedDepts.includes(String(departmentId))) {
        where.departmentId = String(departmentId);
      }
    } else if (isTeamLead(user)) {
      where.OR = [
        { id: { in: user.ledTeamIds } },
        { teamLeadId: user.id },
      ];
    } else {
      where.id = { in: user.membershipTeamIds };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        teamLead: { select: { id: true, fullName: true, email: true, employeeId: true } },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                employeeId: true,
                jobTitle: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: teams.map((t) => ({
        ...t,
        members: t.memberships.map((m) => m.user),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = teamSchema.parse(req.body);

    if (isManager(user)) {
      const allowed = [user.departmentId, ...user.managedDepartmentIds];
      if (!allowed.includes(data.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot create teams in other departments" });
        return;
      }
    }

    const created = await prisma.team.create({
      data: {
        name: data.name,
        code: data.code,
        departmentId: data.departmentId,
        teamLeadId: data.teamLeadId || null,
      },
    });

    if (data.teamLeadId) {
      await prisma.teamMembership.upsert({
        where: { teamId_userId: { teamId: created.id, userId: data.teamLeadId } },
        create: { teamId: created.id, userId: data.teamLeadId },
        update: {},
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "TEAM_CREATED",
      resourceType: "TEAM",
      resourceId: created.id,
      details: data,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = teamSchema.partial().parse(req.body);

    const allowed = await canAccessTeam(user, id);
    if (!allowed && !isSuperAdmin(user)) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Cannot modify this team" });
      return;
    }

    const updated = await prisma.team.update({
      where: { id },
      data,
    });

    if (data.teamLeadId) {
      await prisma.teamMembership.upsert({
        where: { teamId_userId: { teamId: id, userId: data.teamLeadId } },
        create: { teamId: id, userId: data.teamLeadId },
        update: {},
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "TEAM_UPDATED",
      resourceType: "TEAM",
      resourceId: id,
      details: data,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Team updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function addTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);

    const allowed = await canAccessTeam(user, id);
    if (!allowed && !isSuperAdmin(user)) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Cannot manage members for this team" });
      return;
    }

    const membership = await prisma.teamMembership.upsert({
      where: { teamId_userId: { teamId: id, userId } },
      create: { teamId: id, userId },
      update: {},
    });

    res.status(201).json({
      success: true,
      message: "Member added to team successfully",
      data: membership,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id, userId } = req.params;

    const allowed = await canAccessTeam(user, id);
    if (!allowed && !isSuperAdmin(user)) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Cannot manage members for this team" });
      return;
    }

    await prisma.teamMembership.deleteMany({
      where: { teamId: id, userId },
    });

    res.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (err) {
    next(err);
  }
}
