import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { TaskPriority, TaskStatus, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  projectId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  assignedTeamLeadId: z.string().uuid().optional().nullable(),
  assignedUserIds: z.array(z.string().uuid()).default([]),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().nonnegative().nullable().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  assignedTeamLeadId: z.string().uuid().nullable().optional(),
  assignedUserIds: z.array(z.string().uuid()).optional(),
});

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { status, priority, projectId, departmentId, assigneeId, search } = req.query;

    const where: any = {};

    // Organizational Scope Filter
    if (isSuperAdmin(user)) {
      if (departmentId) where.departmentId = String(departmentId);
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean) as string[];
      if (departmentId) {
        where.departmentId = String(departmentId);
      } else if (allowedDepts.length > 0) {
        where.OR = [
          { departmentId: { in: allowedDepts } },
          { createdById: user.id },
          { assignments: { some: { userId: user.id } } },
          { assignments: { some: { user: { reportingManagerId: user.id } } } },
          { teamLead: { reportingManagerId: user.id } },
        ];
      }
    } else if (isTeamLead(user)) {
      const orClauses: any[] = [
        { assignedTeamLeadId: user.id },
        { createdById: user.id },
        { assignments: { some: { userId: user.id } } },
        { assignments: { some: { user: { reportingManagerId: user.id } } } },
      ];
      if (user.departmentId) {
        orClauses.push({ departmentId: user.departmentId });
      }
      where.OR = orClauses;
    } else {
      // Executive sees tasks assigned to them
      where.assignments = { some: { userId: user.id } };
    }

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }

    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      where.priority = priority as TaskPriority;
    }

    if (projectId) where.projectId = String(projectId);

    if (assigneeId) {
      where.assignments = { some: { userId: String(assigneeId) } };
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { taskCode: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        teamLead: { select: { id: true, fullName: true, email: true, role: true, jobTitle: true } },
        createdBy: { select: { id: true, fullName: true, email: true, role: true, jobTitle: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, employeeId: true, role: true, jobTitle: true } },
          },
        },
        dailyWorkEntries: {
          select: { hoursSpent: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Derive actual hours dynamically from recorded work entries only!
    const formatted = tasks.map((t) => {
      const actualHours = t.dailyWorkEntries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0);
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

      return {
        id: t.id,
        taskCode: t.taskCode,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        startDate: t.startDate,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        actualHours: actualHours > 0 ? actualHours : null, // strictly distinguish unreported/zero hours
        progressPercentage: t.progressPercentage,
        isOverdue: !!isOverdue,
        project: t.project,
        department: t.department,
        teamLead: t.teamLead,
        createdBy: t.createdBy,
        assignees: t.assignments.map((a) => a.user),
        commentsCount: t._count.comments,
        createdAt: t.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        department: true,
        teamLead: { select: { id: true, fullName: true, email: true, role: true, jobTitle: true } },
        createdBy: { select: { id: true, fullName: true, email: true, role: true, jobTitle: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, employeeId: true, role: true, jobTitle: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        histories: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        dailyWorkEntries: {
          select: {
            id: true,
            activityTitle: true,
            hoursSpent: true,
            createdAt: true,
            dailyReport: {
              select: {
                reportingDate: true,
                user: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, error: "Not Found", message: "Task not found" });
      return;
    }

    // Authorization Scope Check
    if (isSuperAdmin(user) || isManager(user) || isTeamLead(user)) {
      // Allowed for management/team leads
    } else {
      // Executive
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        res.status(403).json({ success: false, error: "Forbidden", message: "You are not assigned to this task" });
        return;
      }
    }

    const actualHours = task.dailyWorkEntries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0);

    res.json({
      success: true,
      data: {
        ...task,
        assignees: task.assignments.map((a) => a.user),
        actualHours: actualHours > 0 ? actualHours : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = createTaskSchema.parse(req.body);

    // Executives cannot create arbitrary managed tasks
    if (user.role === Role.EXECUTIVE) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Executives cannot create organizational tasks" });
      return;
    }

    // Resolve projectId and departmentId fallback if needed
    let resolvedProjectId = data.projectId || "";
    let resolvedDepartmentId = data.departmentId || user.departmentId || "";

    if (resolvedProjectId) {
      const proj = await prisma.project.findUnique({ where: { id: resolvedProjectId } });
      if (proj && !resolvedDepartmentId) {
        resolvedDepartmentId = proj.departmentId;
      }
    }

    if (!resolvedDepartmentId) {
      const firstDept = await prisma.department.findFirst({ orderBy: { name: "asc" } });
      if (firstDept) resolvedDepartmentId = firstDept.id;
    }

    if (!resolvedProjectId) {
      const firstProj = await prisma.project.findFirst({
        where: resolvedDepartmentId ? { departmentId: resolvedDepartmentId } : {},
        orderBy: { name: "asc" },
      }) || await prisma.project.findFirst({ orderBy: { name: "asc" } });
      if (firstProj) {
        resolvedProjectId = firstProj.id;
        if (!resolvedDepartmentId) resolvedDepartmentId = firstProj.departmentId;
      }
    }

    if (!resolvedProjectId || !resolvedDepartmentId) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Please select a valid Department and Project for this task.",
      });
      return;
    }

    // Combine assignedUserIds and assignedTeamLeadId as needed
    const assigneeIdSet = new Set<string>(data.assignedUserIds);
    let resolvedTeamLeadId: string | null = data.assignedTeamLeadId || (isTeamLead(user) ? user.id : null);

    // If Manager selected a Team Lead in assignedTeamLeadId and left assignedUserIds empty, assign to that Team Lead
    if (resolvedTeamLeadId && assigneeIdSet.size === 0) {
      assigneeIdSet.add(resolvedTeamLeadId);
    }

    if (assigneeIdSet.size === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: isTeamLead(user)
          ? "Please select at least one Executive to assign this task to."
          : "Please select at least one Team Lead or Executive to assign this task to.",
      });
      return;
    }

    // Validate Role-Based Assignment Rules:
    // - Manager can assign tasks to TEAM_LEAD and EXECUTIVE
    // - Team Lead can assign tasks to EXECUTIVE only
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(assigneeIdSet) } },
      select: { id: true, fullName: true, role: true },
    });

    if (isTeamLead(user)) {
      const invalidUsers = targetUsers.filter((u) => u.role !== Role.EXECUTIVE && u.id !== user.id);
      if (invalidUsers.length > 0) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Team Leads can only assign tasks to Executives.",
        });
        return;
      }
      resolvedTeamLeadId = user.id;
    } else if (isManager(user)) {
      const invalidUsers = targetUsers.filter(
        (u) => u.role !== Role.TEAM_LEAD && u.role !== Role.EXECUTIVE && u.role !== Role.MANAGER
      );
      if (invalidUsers.length > 0) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Managers can assign tasks to Managers, Team Leads, and Executives.",
        });
        return;
      }
      // If Manager picked a Team Lead in assignedUserIds and didn't set assignedTeamLeadId, auto-populate assignedTeamLeadId
      if (!resolvedTeamLeadId) {
        const firstTl = targetUsers.find((u) => u.role === Role.TEAM_LEAD);
        if (firstTl) resolvedTeamLeadId = firstTl.id;
      }
    }

    // Generate unique task code TSK-<number>
    const count = await prisma.task.count();
    const taskCode = `TSK-${100 + count + 1}`;
    const finalAssignedUserIds = Array.from(assigneeIdSet);

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          taskCode,
          title: data.title,
          description: data.description,
          projectId: resolvedProjectId,
          departmentId: resolvedDepartmentId,
          assignedTeamLeadId: resolvedTeamLeadId,
          createdById: user.id,
          priority: data.priority,
          status: TaskStatus.TO_DO,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours || null,
        },
      });

      if (finalAssignedUserIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: finalAssignedUserIds.map((userId) => ({
            taskId: created.id,
            userId,
          })),
        });

        // Also notify assignedTeamLeadId if not already in finalAssignedUserIds
        const notifyUserIds = new Set<string>(finalAssignedUserIds);
        if (resolvedTeamLeadId && resolvedTeamLeadId !== user.id) {
          notifyUserIds.add(resolvedTeamLeadId);
        }

        await tx.notification.createMany({
          data: Array.from(notifyUserIds).map((userId) => ({
            recipientId: userId,
            senderId: user.id,
            eventType: "TASK_ASSIGNED",
            title: `New Task Assigned: ${created.title}`,
            message: `${user.fullName} (${user.role.replace("_", " ")}) assigned you to task ${created.taskCode}: "${created.title}".`,
            link: `/tasks/${created.id}`,
          })),
        });
      }

      const assigneeNames = targetUsers.map((u) => `${u.fullName} (${u.role.replace("_", " ")})`).join(", ");
      await tx.taskHistory.create({
        data: {
          taskId: created.id,
          userId: user.id,
          action: "TASK_CREATED",
          newValue: TaskStatus.TO_DO,
          details: `Task created by ${user.fullName} and assigned to ${assigneeNames}`,
        },
      });

      return created;
    });

    await logAuditEvent({
      userId: user.id,
      action: "TASK_CREATED",
      resourceType: "TASK",
      resourceId: task.id,
      details: { taskCode: task.taskCode, title: task.title, assignedUserIds: finalAssignedUserIds },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Task created and assigned successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!task) {
      res.status(404).json({ success: false, error: "Not Found", message: "Task not found" });
      return;
    }

    // Role restrictions for editing task parameters
    if (user.role === Role.EXECUTIVE) {
      // Executives can only update status and progress percentage on tasks assigned to them
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Not authorized to update this task" });
        return;
      }

      const onlyStatusAndProgress = Object.keys(data).every((k) => ["status", "progressPercentage"].includes(k));
      if (!onlyStatusAndProgress) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Executives can only update status and progress percentage" });
        return;
      }
    }

    // Validate Role-Based Assignment Rules when updating assignees
    let resolvedTeamLeadId = data.assignedTeamLeadId;
    let targetAssigneeSummary = "";

    if (data.assignedUserIds) {
      const targetUsers = await prisma.user.findMany({
        where: { id: { in: data.assignedUserIds } },
        select: { id: true, fullName: true, role: true },
      });

      if (isTeamLead(user)) {
        const invalidUsers = targetUsers.filter((u) => u.role !== Role.EXECUTIVE && u.id !== user.id);
        if (invalidUsers.length > 0) {
          res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Team Leads can only assign or delegate tasks to Executives.",
          });
          return;
        }
        // Keep the Team Lead as the task's assignedTeamLeadId when delegating to an Executive
        if (!task.assignedTeamLeadId) {
          resolvedTeamLeadId = user.id;
        }
      } else if (isManager(user)) {
        const invalidUsers = targetUsers.filter(
          (u) => u.role !== Role.TEAM_LEAD && u.role !== Role.EXECUTIVE
        );
        if (invalidUsers.length > 0) {
          res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Managers can only assign tasks to Team Leads and Executives.",
          });
          return;
        }
        if (resolvedTeamLeadId === undefined) {
          const firstTl = targetUsers.find((u) => u.role === Role.TEAM_LEAD);
          if (firstTl) resolvedTeamLeadId = firstTl.id;
        }
      }

      targetAssigneeSummary = targetUsers.map((u) => `${u.fullName} (${u.role.replace("_", " ")})`).join(", ");
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
          estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : undefined,
          progressPercentage: data.progressPercentage !== undefined ? data.progressPercentage : undefined,
          assignedTeamLeadId: resolvedTeamLeadId !== undefined ? resolvedTeamLeadId : undefined,
        },
      });

      if (data.assignedUserIds) {
        // Replace assignments
        await tx.taskAssignment.deleteMany({ where: { taskId: id } });
        if (data.assignedUserIds.length > 0) {
          await tx.taskAssignment.createMany({
            data: data.assignedUserIds.map((userId) => ({
              taskId: id,
              userId,
            })),
          });

          // Notify new assignees
          await tx.notification.createMany({
            data: data.assignedUserIds.map((userId) => ({
              recipientId: userId,
              senderId: user.id,
              eventType: "TASK_REASSIGNED",
              title: `Task Assigned: ${task.title}`,
              message: `${user.fullName} (${user.role.replace("_", " ")}) assigned you to task ${task.taskCode}: "${task.title}".`,
              link: `/tasks/${id}`,
            })),
          });
        }

        await tx.taskHistory.create({
          data: {
            taskId: id,
            userId: user.id,
            action: isTeamLead(user) ? "TASK_DELEGATED_TO_EXECUTIVE" : "TASK_ASSIGNED",
            newValue: targetAssigneeSummary,
            details: `${user.fullName} (${user.role.replace("_", " ")}) assigned task to: ${targetAssigneeSummary || "Unassigned"}`,
          },
        });
      }

      if (data.status && data.status !== task.status) {
        await tx.taskHistory.create({
          data: {
            taskId: id,
            userId: user.id,
            action: "STATUS_CHANGED",
            previousValue: task.status,
            newValue: data.status,
            details: `Status changed from ${task.status} to ${data.status}`,
          },
        });
      }
    });

    res.json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function addTaskComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!task) {
      res.status(404).json({ success: false, error: "Not Found", message: "Task not found" });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: user.id,
        content,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Notify other assignees & creator
    const recipientIds = new Set<string>();
    task.assignments.forEach((a) => {
      if (a.userId !== user.id) recipientIds.add(a.userId);
    });
    if (task.createdById !== user.id) recipientIds.add(task.createdById);

    if (recipientIds.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(recipientIds).map((recipientId) => ({
          recipientId,
          senderId: user.id,
          eventType: "TASK_COMMENT",
          title: `New Comment on ${task.taskCode}`,
          message: `${user.fullName} commented on "${task.title}": ${content.slice(0, 80)}...`,
          link: `/tasks/${id}`,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (err) {
    next(err);
  }
}
