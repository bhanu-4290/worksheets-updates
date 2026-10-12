import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { EscalationStatus, EscalationUrgency, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const createEscalationSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  urgency: z.nativeEnum(EscalationUrgency).default(EscalationUrgency.NORMAL),
  departmentId: z.string().uuid(),
  workEntryId: z.string().uuid().optional().nullable(),
  dailyReportId: z.string().uuid().optional().nullable(),
});

const resolveEscalationSchema = z.object({
  status: z.nativeEnum(EscalationStatus),
  assignedOwnerId: z.string().uuid().optional().nullable(),
  resolutionNotes: z.string().min(3),
});

export async function getEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { status, urgency, departmentId } = req.query;

    const where: any = {};

    if (isSuperAdmin(user)) {
      if (departmentId) where.departmentId = String(departmentId);
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.departmentId = { in: allowedDepts };
    } else if (isTeamLead(user)) {
      where.OR = [
        { escalatedById: user.id },
        { departmentId: user.departmentId || "" },
      ];
    } else {
      where.escalatedById = user.id;
    }

    if (status && Object.values(EscalationStatus).includes(status as EscalationStatus)) {
      where.status = status as EscalationStatus;
    }

    if (urgency && Object.values(EscalationUrgency).includes(urgency as EscalationUrgency)) {
      where.urgency = urgency as EscalationUrgency;
    }

    const escalations = await prisma.blockerEscalation.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        escalatedBy: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        assignedOwner: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        dailyReport: {
          select: {
            id: true,
            reportingDate: true,
            user: { select: { id: true, fullName: true, employeeId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: escalations,
    });
  } catch (err) {
    next(err);
  }
}

export async function createEscalation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = createEscalationSchema.parse(req.body);

    // Find the department manager to notify
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { managerId: true, name: true },
    });

    const escalation = await prisma.$transaction(async (tx) => {
      const created = await tx.blockerEscalation.create({
        data: {
          title: data.title,
          description: data.description,
          urgency: data.urgency,
          departmentId: data.departmentId,
          escalatedById: user.id,
          workEntryId: data.workEntryId || null,
          dailyReportId: data.dailyReportId || null,
          status: EscalationStatus.OPEN,
          assignedOwnerId: dept?.managerId || null,
        },
      });

      // Notify Department Manager
      if (dept?.managerId) {
        await tx.notification.create({
          data: {
            recipientId: dept.managerId,
            senderId: user.id,
            eventType: "BLOCKER_ESCALATED",
            title: `Blocker Escalated: ${created.title}`,
            message: `${user.fullName} escalated a blocker for ${dept.name} (${created.urgency} priority).`,
            link: `/escalations`,
          },
        });
      }

      return created;
    });

    await logAuditEvent({
      userId: user.id,
      action: "BLOCKER_ESCALATED",
      resourceType: "BLOCKER_ESCALATION",
      resourceId: escalation.id,
      details: { title: escalation.title, urgency: escalation.urgency },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Blocker escalated successfully to Department Manager",
      data: escalation,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEscalation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = resolveEscalationSchema.parse(req.body);

    const escalation = await prisma.blockerEscalation.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!escalation) {
      res.status(404).json({ success: false, error: "Not Found", message: "Escalation not found" });
      return;
    }

    if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds];
      if (!allowedDepts.includes(escalation.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot manage escalations outside your department" });
        return;
      }
    } else if (!isSuperAdmin(user)) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Only Managers or Super Admins can resolve or update escalations" });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resUpdated = await tx.blockerEscalation.update({
        where: { id },
        data: {
          status: data.status,
          assignedOwnerId: data.assignedOwnerId || undefined,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: data.status === EscalationStatus.RESOLVED ? new Date() : undefined,
        },
      });

      // Notify the person who escalated it
      await tx.notification.create({
        data: {
          recipientId: escalation.escalatedById,
          senderId: user.id,
          eventType: "ESCALATION_RESOLVED",
          title: `Escalation Updated: ${escalation.title}`,
          message: `${user.fullName} updated escalation status to ${data.status}: "${data.resolutionNotes}".`,
          link: `/escalations`,
        },
      });

      // If re-escalated to admin, notify Super Admin
      if (data.status === EscalationStatus.ESCALATED_TO_ADMIN) {
        const admins = await tx.user.findMany({ where: { role: Role.SUPER_ADMIN, isActive: true } });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              recipientId: admin.id,
              senderId: user.id,
              eventType: "BLOCKER_ESCALATED_TO_ADMIN",
              title: `Blocker Escalated to Super Admin: ${escalation.title}`,
              message: `Manager ${user.fullName} escalated an unresolved issue to organization management.`,
              link: `/escalations`,
            },
          });
        }
      }

      return resUpdated;
    });

    await logAuditEvent({
      userId: user.id,
      action: "ESCALATION_UPDATED",
      resourceType: "BLOCKER_ESCALATION",
      resourceId: id,
      details: { status: data.status, notes: data.resolutionNotes },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Escalation updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
