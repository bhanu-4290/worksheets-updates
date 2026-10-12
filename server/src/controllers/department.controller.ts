import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { isSuperAdmin, isManager, canAccessDepartment } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const where: any = {};

    if (!isSuperAdmin(user)) {
      if (isManager(user)) {
        where.id = { in: [user.departmentId, ...user.managedDepartmentIds].filter(Boolean) };
      } else {
        where.id = user.departmentId || "";
      }
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        manager: { select: { id: true, fullName: true, email: true, employeeId: true } },
        _count: {
          select: {
            users: true,
            teams: true,
            projects: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (!canAccessDepartment(user, id)) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Access to this department is denied" });
      return;
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, fullName: true, email: true, employeeId: true } },
        teams: {
          include: {
            teamLead: { select: { id: true, fullName: true, email: true } },
            _count: { select: { memberships: true } },
          },
        },
        projects: true,
        _count: { select: { users: true } },
      },
    });

    if (!department) {
      res.status(404).json({ success: false, error: "Not Found", message: "Department not found" });
      return;
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = departmentSchema.parse(req.body);

    const created = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        managerId: data.managerId || null,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: "DEPARTMENT_CREATED",
      resourceType: "DEPARTMENT",
      resourceId: created.id,
      details: data,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = departmentSchema.partial().parse(req.body);

    const updated = await prisma.department.update({
      where: { id },
      data,
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: "DEPARTMENT_UPDATED",
      resourceType: "DEPARTMENT",
      resourceId: id,
      details: data,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Department updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
