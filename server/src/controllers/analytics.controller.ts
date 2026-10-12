import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { ReportStatus, TaskStatus, EscalationStatus, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead } from "../middleware/scope.middleware.js";

// Helper to determine if a date is an active work day given company settings and holidays
async function getWorkingDaysCount(startDate: Date, endDate: Date): Promise<number> {
  const settings = await prisma.companySetting.findFirst();
  const workDaysList = (settings?.workDays || "Monday,Tuesday,Wednesday,Thursday,Friday")
    .split(",")
    .map((d) => d.trim().toLowerCase());

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const holidayDateSet = new Set(holidays.map((h) => h.date.toISOString().split("T")[0]));

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  let count = 0;
  const curr = new Date(startDate);
  curr.setUTCHours(0, 0, 0, 0);

  while (curr <= endDate) {
    const dayName = dayNames[curr.getUTCDay()];
    const dateStr = curr.toISOString().split("T")[0];

    const isCompanyWorkDay = workDaysList.includes(dayName);
    const isHoliday = holidayDateSet.has(dateStr);

    if (isCompanyWorkDay && !isHoliday) {
      count++;
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return count;
}

export async function getDashboardKpi(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    if (user.role === Role.EXECUTIVE) {
      // Executive Dashboard KPIs
      const todayReport = await prisma.dailyReport.findUnique({
        where: { user_date_unique: { userId: user.id, reportingDate: today } },
        include: { entries: true, reviews: { take: 1, orderBy: { createdAt: "desc" } } },
      });

      const assignedTasks = await prisma.task.count({
        where: { assignments: { some: { userId: user.id } } },
      });

      const inProgressTasks = await prisma.task.count({
        where: { assignments: { some: { userId: user.id } }, status: TaskStatus.IN_PROGRESS },
      });

      const completedTasks = await prisma.task.count({
        where: { assignments: { some: { userId: user.id } }, status: TaskStatus.COMPLETED },
      });

      const overdueTasks = await prisma.task.count({
        where: {
          assignments: { some: { userId: user.id } },
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      });

      const recentReports = await prisma.dailyReport.findMany({
        where: { userId: user.id },
        include: { entries: true, reviews: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { reportingDate: "desc" },
        take: 7,
      });

      res.json({
        success: true,
        data: {
          role: user.role,
          todayReportStatus: todayReport ? todayReport.status : "NOT_STARTED",
          todayReport,
          assignedTasks,
          inProgressTasks,
          completedTasks,
          overdueTasks,
          recentReports: recentReports.map((r) => ({
            id: r.id,
            reportingDate: r.reportingDate.toISOString().split("T")[0],
            status: r.status,
            entriesCount: r.entries.length,
            hoursSpent: r.entries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0) || null,
            latestReview: r.reviews[0] || null,
          })),
        },
      });
      return;
    }

    if (user.role === Role.TEAM_LEAD) {
      // Team Lead Dashboard KPIs
      // Subordinates
      const subordinateUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { teamLeadId: user.id },
            { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
          ],
        },
        select: { id: true },
      });
      const subUserIds = subordinateUsers.map((u) => u.id);

      const teamSize = subUserIds.length;

      const todaySubmissions = await prisma.dailyReport.count({
        where: { userId: { in: subUserIds }, reportingDate: today, status: { not: ReportStatus.DRAFT } },
      });

      const pendingReviews = await prisma.dailyReport.count({
        where: {
          userId: { in: subUserIds },
          status: { in: [ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW] },
        },
      });

      const revisionsReturned = await prisma.dailyReport.count({
        where: {
          userId: { in: subUserIds },
          status: ReportStatus.REVISION_REQUESTED,
        },
      });

      const teamTasks = await prisma.task.count({
        where: {
          OR: [
            { assignedTeamLeadId: user.id },
            { assignments: { some: { userId: { in: subUserIds } } } },
          ],
        },
      });

      const overdueTasks = await prisma.task.count({
        where: {
          OR: [
            { assignedTeamLeadId: user.id },
            { assignments: { some: { userId: { in: subUserIds } } } },
          ],
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      });

      const blockedTasks = await prisma.task.count({
        where: {
          OR: [
            { assignedTeamLeadId: user.id },
            { assignments: { some: { userId: { in: subUserIds } } } },
          ],
          status: TaskStatus.BLOCKED,
        },
      });

      res.json({
        success: true,
        data: {
          role: user.role,
          teamSize,
          todaySubmissions,
          pendingSubmissions: Math.max(0, teamSize - todaySubmissions),
          pendingReviews,
          revisionsReturned,
          teamTasks,
          overdueTasks,
          blockedTasks,
        },
      });
      return;
    }

    if (user.role === Role.MANAGER) {
      // Manager Dashboard KPIs (Strictly Department Scope)
      const allowedDepts: string[] = [user.departmentId, ...user.managedDepartmentIds].filter((d): d is string => Boolean(d));

      const deptUsers = await prisma.user.findMany({
        where: { departmentId: { in: allowedDepts }, isActive: true },
        select: { id: true },
      });
      const deptUserIds = deptUsers.map((u) => u.id);

      const departmentEmployeeCount = deptUserIds.length;

      const teamsCount = await prisma.team.count({
        where: { departmentId: { in: allowedDepts } },
      });

      const todaySubmissions = await prisma.dailyReport.count({
        where: { userId: { in: deptUserIds }, reportingDate: today, status: { not: ReportStatus.DRAFT } },
      });

      const pendingReviews = await prisma.dailyReport.count({
        where: {
          userId: { in: deptUserIds },
          status: { in: [ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW] },
        },
      });

      const criticalBlockers = await prisma.blockerEscalation.count({
        where: {
          departmentId: { in: allowedDepts },
          status: { in: [EscalationStatus.OPEN, EscalationStatus.IN_PROGRESS] },
        },
      });

      const deptTasksCount = await prisma.task.count({
        where: { departmentId: { in: allowedDepts } },
      });

      const deptOverdueTasks = await prisma.task.count({
        where: {
          departmentId: { in: allowedDepts },
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      });

      res.json({
        success: true,
        data: {
          role: user.role,
          departmentEmployeeCount,
          teamsCount,
          todaySubmissions,
          pendingSubmissions: Math.max(0, departmentEmployeeCount - todaySubmissions),
          compliancePercentage: departmentEmployeeCount > 0 ? Math.round((todaySubmissions / departmentEmployeeCount) * 100) : 100,
          pendingReviews,
          criticalBlockers,
          deptTasksCount,
          deptOverdueTasks,
        },
      });
      return;
    }

    // SUPER_ADMIN Dashboard KPIs
    const totalEmployees = await prisma.user.count({ where: { isActive: true } });
    const totalDepartments = await prisma.department.count({ where: { isActive: true } });
    const totalTeams = await prisma.team.count({ where: { isActive: true } });
    const totalProjects = await prisma.project.count();

    const todaySubmissions = await prisma.dailyReport.count({
      where: { reportingDate: today, status: { not: ReportStatus.DRAFT } },
    });

    const pendingReviews = await prisma.dailyReport.count({
      where: { status: { in: [ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW] } },
    });

    const activeEscalations = await prisma.blockerEscalation.count({
      where: { status: { in: [EscalationStatus.OPEN, EscalationStatus.IN_PROGRESS, EscalationStatus.ESCALATED_TO_ADMIN] } },
    });

    const activeTasks = await prisma.task.count({
      where: { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } },
    });

    res.json({
      success: true,
      data: {
        role: user.role,
        totalEmployees,
        totalDepartments,
        totalTeams,
        totalProjects,
        todaySubmissions,
        pendingReviews,
        activeEscalations,
        activeTasks,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { startDate, endDate, departmentId } = req.query;

    const start = startDate ? new Date(String(startDate)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(String(endDate)) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const workingDays = await getWorkingDaysCount(start, end);

    const userWhere: any = { isActive: true, role: Role.EXECUTIVE };

    if (!isSuperAdmin(user)) {
      if (isManager(user)) {
        const allowedDepts: string[] = [user.departmentId, ...user.managedDepartmentIds].filter((d): d is string => Boolean(d));
        userWhere.departmentId = { in: allowedDepts };
      } else if (isTeamLead(user)) {
        userWhere.OR = [
          { teamLeadId: user.id },
          { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
        ];
      } else {
        userWhere.id = user.id;
      }
    } else if (departmentId) {
      userWhere.departmentId = String(departmentId);
    }

    const employees = await prisma.user.findMany({
      where: userWhere,
      include: {
        department: true,
        dailyReports: {
          where: {
            reportingDate: { gte: start, lte: end },
            status: { not: ReportStatus.DRAFT },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const results = employees.map((emp) => {
      const actualSubmissions = emp.dailyReports.length;
      const expectedSubmissions = workingDays;
      const missingSubmissions = Math.max(0, expectedSubmissions - actualSubmissions);
      const complianceRate = expectedSubmissions > 0 ? Math.min(100, Math.round((actualSubmissions / expectedSubmissions) * 100)) : 100;

      return {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department?.name || "None",
        workingDays,
        expectedSubmissions,
        actualSubmissions,
        missingSubmissions,
        complianceRate,
      };
    });

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] },
        workingDays,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportReportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { type, startDate, endDate } = req.query;

    const start = startDate ? new Date(String(startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(String(endDate)) : new Date();

    const reportWhere: any = {
      reportingDate: { gte: start, lte: end },
    };

    if (!isSuperAdmin(user)) {
      if (isManager(user)) {
        const allowedDepts: string[] = [user.departmentId, ...user.managedDepartmentIds].filter((d): d is string => Boolean(d));
        reportWhere.user = { departmentId: { in: allowedDepts } };
      } else if (isTeamLead(user)) {
        reportWhere.user = {
          OR: [
            { teamLeadId: user.id },
            { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
          ],
        };
      } else {
        reportWhere.userId = user.id;
      }
    }

    const reports = await prisma.dailyReport.findMany({
      where: reportWhere,
      include: {
        user: { include: { department: true } },
        entries: { include: { task: true } },
        reviews: { include: { reviewer: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { reportingDate: "desc" },
    });

    const csvHeaders = "ReportDate,EmployeeID,FullName,Department,Status,EntriesCount,RecordedHours,ReviewStatus,Reviewer,Blockers\n";
    const csvRows = reports
      .map((r) => {
        const hours = r.entries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0);
        const blockers = r.entries
          .map((e) => e.blockers)
          .filter(Boolean)
          .join(" | ")
          .replace(/"/g, '""');

        return `"${r.reportingDate.toISOString().split("T")[0]}","${r.user.employeeId}","${r.user.fullName}","${
          r.user.department?.name || "None"
        }","${r.status}","${r.entries.length}","${hours > 0 ? hours : "Unreported"}","${
          r.reviews[0]?.reviewStatus || "Pending"
        }","${r.reviews[0]?.reviewer.fullName || "None"}","${blockers}"`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=worktrack_reports_export.csv");
    res.status(200).send(csvHeaders + csvRows);
  } catch (err) {
    next(err);
  }
}
