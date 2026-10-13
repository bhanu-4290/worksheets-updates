import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { isSuperAdmin, isManager } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const projectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(15).toUpperCase(),
  description: z.string().optional(),
  departmentId: z.string().uuid(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { departmentId, status } = req.query;
    const where: any = {};

    if (!isSuperAdmin(user)) {
      if (isManager(user)) {
        const allowed = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
        if (allowed.length > 0) {
          where.departmentId = { in: allowed };
        }
      } else if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    } else if (departmentId) {
      where.departmentId = String(departmentId);
    }

    if (status) where.status = String(status);

    let projects = await prisma.project.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { name: "asc" },
    });

    if (projects.length === 0 && !isSuperAdmin(user)) {
      projects = await prisma.project.findMany({
        where: status ? { status: String(status) as any } : {},
        include: {
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { name: "asc" },
      });
    }

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = projectSchema.parse(req.body);

    if (isManager(user)) {
      const allowed = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      if (allowed.length > 0 && !allowed.includes(data.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot create projects in other departments" });
        return;
      }
    }

    const created = await prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "PROJECT_CREATED",
      resourceType: "PROJECT",
      resourceId: created.id,
      details: data,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = projectSchema.partial().parse(req.body);

    const target = await prisma.project.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ success: false, error: "Not Found", message: "Project not found" });
      return;
    }

    if (isManager(user)) {
      const allowed = [user.departmentId, ...user.managedDepartmentIds];
      if (!allowed.includes(target.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot modify projects in other departments" });
        return;
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    res.json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
