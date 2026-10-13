import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead, canAccessEmployee } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";
import { checkAndTriggerBirthdays } from "./announcement.controller.js";

const createUserSchema = z.object({
  employeeId: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  jobTitle: z.string().min(2),
  role: z.nativeEnum(Role),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  teamLeadId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  joiningDate: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  jobTitle: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  teamLeadId: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { departmentId, role, search, status, flow } = req.query;

    const where: any = {};

    // Organizational Scope Filter (bypassed when requesting organization-wide flow chart)
    if (flow === "true" || isSuperAdmin(user)) {
      if (departmentId) where.departmentId = String(departmentId);
    } else if (isManager(user)) {
      // Manager can only see their department
      const allowedDeptIds = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.departmentId = { in: allowedDeptIds };
    } else if (isTeamLead(user)) {
      // Team lead can only see members of their led teams or reporting to them
      where.OR = [
        { teamLeadId: user.id },
        { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
        { id: user.id },
      ];
    } else {
      // Executive sees team members in same teams
      where.teamMemberships = { some: { teamId: { in: user.membershipTeamIds } } };
    }

    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    if (search) {
      const q = String(search).toLowerCase();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { employeeId: { contains: q, mode: "insensitive" } },
            { jobTitle: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        email: true,
        fullName: true,
        jobTitle: true,
        role: true,
        departmentId: true,
        managerId: true,
        teamLeadId: true,
        joiningDate: true,
        dateOfBirth: true,
        isActive: true,
        createdAt: true,
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, fullName: true, email: true } },
        teamLead: { select: { id: true, fullName: true, email: true } },
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        teams: u.teamMemberships.map((m) => m.team),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const allowed = await canAccessEmployee(user, id);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You are not authorized to view this employee's records",
      });
      return;
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        teamLead: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!target) {
      res.status(404).json({ success: false, error: "Not Found", message: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        ...target,
        teams: target.teamMemberships.map((m) => m.team),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase() }, { employeeId: data.employeeId }],
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: "Conflict",
        message: existing.email === data.email.toLowerCase()
          ? "A user with this email already exists"
          : "A user with this Employee ID already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          employeeId: data.employeeId,
          email: data.email.toLowerCase(),
          passwordHash,
          fullName: data.fullName,
          jobTitle: data.jobTitle,
          role: data.role,
          departmentId: data.departmentId || null,
          managerId: data.managerId || null,
          teamLeadId: data.teamLeadId || null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
      });

      if (data.teamId) {
        await tx.teamMembership.create({
          data: {
            teamId: data.teamId,
            userId: created.id,
          },
        });
      }

      return created;
    });

    // Automatically trigger birthday celebration if today is the employee's birthday
    if (data.dateOfBirth) {
      checkAndTriggerBirthdays().catch((e) => console.error("[BIRTHDAY] Error triggering:", e));
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: newUser.id,
      details: { email: newUser.email, role: newUser.role, employeeId: newUser.employeeId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser.id,
        employeeId: newUser.employeeId,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
      },
    });
  } catch (err) {
    next(err);
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  jobTitle: z.string().min(2, "Job title must be at least 2 characters").optional(),
  dateOfBirth: z.string().nullable().optional(),
});

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = updateProfileSchema.parse(req.body);

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase(), id: { not: user.id } },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          error: "Conflict",
          message: "A user with this email already exists",
        });
        return;
      }
    }

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle.trim();
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        email: true,
        fullName: true,
        jobTitle: true,
        role: true,
        departmentId: true,
        managerId: true,
        teamLeadId: true,
        joiningDate: true,
        dateOfBirth: true,
        isActive: true,
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, fullName: true, email: true } },
        teamLead: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (data.dateOfBirth) {
      checkAndTriggerBirthdays().catch((e) => console.error("[BIRTHDAY] Error triggering:", e));
    }

    await logAuditEvent({
      userId: user.id,
      action: "PROFILE_UPDATED",
      resourceType: "USER",
      resourceId: user.id,
      details: data,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Profile details updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUser = req.user!;
    const { id } = req.params;
    const isSelf = currentUser.id === id;
    const isAdmin = isSuperAdmin(currentUser);

    if (!isSelf && !isAdmin) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You can only edit your own details",
      });
      return;
    }

    const data = updateUserSchema.parse(req.body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ success: false, error: "Not Found", message: "User not found" });
      return;
    }

    // STRICT RULE: Date of Birth can ONLY be edited by the user themselves!
    if (data.dateOfBirth !== undefined && !isSelf) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Date of Birth can only be set and edited by the employee themselves.",
      });
      return;
    }

    // Circular reporting check
    if (data.managerId === id) {
      res.status(400).json({
        success: false,
        error: "Invalid Assignment",
        message: "An employee cannot be their own manager",
      });
      return;
    }

    if (data.teamLeadId === id) {
      res.status(400).json({
        success: false,
        error: "Invalid Assignment",
        message: "An employee cannot be their own team lead",
      });
      return;
    }

    const updateData: any = { ...data };

    // Non-admins cannot alter their role, active status, department, or supervisor hierarchy
    if (!isAdmin) {
      delete updateData.role;
      delete updateData.isActive;
      delete updateData.departmentId;
      delete updateData.managerId;
      delete updateData.teamLeadId;
    }

    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (data.dateOfBirth) {
      checkAndTriggerBirthdays().catch((e) => console.error("[BIRTHDAY] Error triggering:", e));
    }

    await logAuditEvent({
      userId: currentUser.id,
      action: "USER_UPDATED",
      resourceType: "USER",
      resourceId: id,
      details: data,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ success: false, error: "Not Found", message: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      resourceType: "USER",
      resourceId: id,
      details: { email: target.email, previousStatus: target.isActive, newStatus: isActive },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function importUsersCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { csvText } = z.object({ csvText: z.string().min(5) }).parse(req.body);

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      res.status(400).json({ success: false, error: "Invalid CSV", message: "CSV has no data rows" });
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["employeeid", "email", "fullname", "jobtitle", "role"];
    const hasRequired = required.every((r) => headers.includes(r));

    if (!hasRequired) {
      res.status(400).json({
        success: false,
        error: "Invalid CSV Headers",
        message: `CSV must contain columns: ${required.join(", ")}`,
      });
      return;
    }

    const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      try {
        const empId = row.employeeid;
        const email = row.email.toLowerCase();
        const role = (row.role || "EXECUTIVE").toUpperCase() as Role;

        if (!Object.values(Role).includes(role)) {
          results.errors.push(`Row ${i}: Invalid role "${row.role}"`);
          results.skipped++;
          continue;
        }

        const existing = await prisma.user.findFirst({
          where: { OR: [{ email }, { employeeId: empId }] },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.user.create({
          data: {
            employeeId: empId,
            email,
            passwordHash: defaultPasswordHash,
            fullName: row.fullname,
            jobTitle: row.jobtitle,
            role,
          },
        });

        results.imported++;
      } catch (e: any) {
        results.errors.push(`Row ${i}: ${e.message}`);
        results.skipped++;
      }
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: "USERS_IMPORTED_CSV",
      resourceType: "USER",
      details: results,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `CSV Import complete: ${results.imported} created, ${results.skipped} skipped.`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportUsersCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const where: any = {};

    if (isSuperAdmin(user)) {
      // all
    } else if (isManager(user)) {
      where.departmentId = { in: [user.departmentId, ...user.managedDepartmentIds].filter(Boolean) };
    } else if (isTeamLead(user)) {
      where.OR = [
        { teamLeadId: user.id },
        { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
      ];
    } else {
      res.status(403).json({ success: false, error: "Forbidden", message: "Executives cannot export directory" });
      return;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: { employeeId: "asc" },
    });

    const csvHeaders = "EmployeeID,FullName,Email,JobTitle,Role,Department,Status,JoiningDate\n";
    const csvRows = users
      .map(
        (u) =>
          `"${u.employeeId}","${u.fullName}","${u.email}","${u.jobTitle}","${u.role}","${
            u.department?.name || "None"
          }","${u.isActive ? "Active" : "Inactive"}","${u.joiningDate.toISOString().split("T")[0]}"`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees_export.csv");
    res.status(200).send(csvHeaders + csvRows);
  } catch (err) {
    next(err);
  }
}
