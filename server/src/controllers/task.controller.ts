import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { TaskPriority, TaskStatus, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  projectId: z.string().uuid(),
  departmentId: z.string().uuid(),
  assignedTeamLeadId: z.string().uuid().optional().nullable(),
  assignedUserIds: z.array(z.string().uuid()).min(1),
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
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.departmentId = { in: allowedDepts };
      if (departmentId && allowedDepts.includes(String(departmentId))) {
        where.departmentId = String(departmentId);
      }
    } else if (isTeamLead(user)) {
      where.OR = [
        { assignedTeamLeadId: user.id },
        { assignments: { some: { userId: user.id } } },
        { departmentId: user.departmentId || "" },
      ];
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
        teamLead: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, employeeId: true } },
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
        teamLead: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        createdBy: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, employeeId: true, jobTitle: true } },
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
    if (isSuperAdmin(user)) {
      // Allowed
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      if (!allowedDepts.includes(task.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot access task outside your department" });
        return;
      }
    } else if (isTeamLead(user)) {
      const isLeadOrCreator = task.assignedTeamLeadId === user.id || task.createdById === user.id;
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      const isSameDept = task.departmentId === user.departmentId;
      if (!isLeadOrCreator && !isAssigned && !isSameDept) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot access this task" });
        return;
      }
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

    // Manager scope check
    if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds];
      if (!allowedDepts.includes(data.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot create tasks for other departments" });
        return;
      }
    }

    // Generate unique task code TSK-<number>
    const count = await prisma.task.count();
    const taskCode = `TSK-${100 + count + 1}`;

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          taskCode,
          title: data.title,
          description: data.description,
          projectId: data.projectId,
          departmentId: data.departmentId,
          assignedTeamLeadId: data.assignedTeamLeadId || (isTeamLead(user) ? user.id : null),
          createdById: user.id,
          priority: data.priority,
          status: TaskStatus.TO_DO,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours || null,
        },
      });

      if (data.assignedUserIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: data.assignedUserIds.map((userId) => ({
            taskId: created.id,
            userId,
          })),
        });

        // Notifications for assignees
        await tx.notification.createMany({
          data: data.assignedUserIds.map((userId) => ({
            recipientId: userId,
            senderId: user.id,
            eventType: "TASK_ASSIGNED",
            title: `New Task: ${created.title}`,
            message: `You were assigned to task ${created.taskCode}: "${created.title}".`,
            link: `/tasks/${created.id}`,
          })),
        });
      }

      await tx.taskHistory.create({
        data: {
          taskId: created.id,
          userId: user.id,
          action: "TASK_CREATED",
          newValue: TaskStatus.TO_DO,
          details: `Task created by ${user.fullName}`,
        },
      });

      return created;
    });

    await logAuditEvent({
      userId: user.id,
      action: "TASK_CREATED",
      resourceType: "TASK",
      resourceId: task.id,
      details: { taskCode: task.taskCode, title: task.title },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
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

    if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds];
      if (!allowedDepts.includes(task.departmentId)) {
        res.status(403).json({ success: false, error: "Forbidden", message: "Cannot edit tasks in other departments" });
        return;
      }
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
          assignedTeamLeadId: data.assignedTeamLeadId !== undefined ? data.assignedTeamLeadId : undefined,
        },
      });

      if (data.assignedUserIds) {
        // Replace assignments
        await tx.taskAssignment.deleteMany({ where: { taskId: id } });
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
            title: `Task Assignment Updated: ${task.title}`,
            message: `Task assignment has been updated by ${user.fullName}.`,
            link: `/tasks/${id}`,
          })),
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
