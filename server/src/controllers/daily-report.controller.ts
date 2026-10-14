import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { ReportStatus, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead, canAccessEmployee } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const workEntrySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid().nullable().optional(),
  activityTitle: z.string().min(2),
  description: z.string().min(2),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  hoursSpent: z.number().nonnegative().nullable().optional(),
  progressPercentage: z.number().min(0).max(100).default(0),
  status: z.string().default("IN_PROGRESS"),
  deliverables: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
  supportRequired: z.string().nullable().optional(),
  nextDayPlan: z.string().nullable().optional(),
});

const saveReportSchema = z.object({
  reportingDate: z.string(), // YYYY-MM-DD
  status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
  entries: z.array(workEntrySchema).min(1, "At least one activity entry is required"),
});

export async function getDailyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { startDate, endDate, employeeId, status, departmentId } = req.query;

    const where: any = {};

    // Organizational Scope Filter
    if (isSuperAdmin(user)) {
      if (departmentId) {
        where.user = { departmentId: String(departmentId) };
      }
      if (employeeId && employeeId !== "ALL" && employeeId !== "all") {
        where.OR = [
          { userId: String(employeeId) },
          { user: { employeeId: String(employeeId) } }
        ];
      }
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.user = {
        departmentId: { in: allowedDepts },
      };
      if (employeeId) {
        where.userId = String(employeeId);
      }
    } else if (isTeamLead(user)) {
      // Team lead sees subordinate reports + their own
      where.user = {
        OR: [
          { teamLeadId: user.id },
          { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
          { id: user.id },
        ],
      };
      if (employeeId) {
        where.userId = String(employeeId);
      }
    } else {
      // Executive ONLY sees their own reports
      where.userId = user.id;
    }

    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }

    if (startDate || endDate) {
      where.reportingDate = {};
      if (startDate) where.reportingDate.gte = new Date(String(startDate));
      if (endDate) where.reportingDate.lte = new Date(String(endDate));
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeId: true,
            jobTitle: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        entries: {
          include: {
            task: { select: { id: true, taskCode: true, title: true } },
          },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { reportingDate: "desc" },
    });

    const formatted = reports.map((r) => {
      // Total hours is calculated only from entries with recorded hours
      const recordedHours = r.entries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0);
      const hasUnreportedHours = r.entries.some((e) => e.hoursSpent === null || e.hoursSpent === undefined);
      const blockerCount = r.entries.filter((e) => e.blockers && e.blockers.trim().length > 0).length;

      return {
        id: r.id,
        reportingDate: r.reportingDate.toISOString().split("T")[0],
        status: r.status,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
        user: r.user,
        entriesCount: r.entries.length,
        totalHoursRecorded: recordedHours > 0 ? recordedHours : null,
        hasUnreportedHours,
        blockerCount,
        latestReview: r.reviews[0] || null,
        entries: r.entries,
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

export async function getTodayReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const report = await prisma.dailyReport.findUnique({
      where: {
        user_date_unique: {
          userId: user.id,
          reportingDate: today,
        },
      },
      include: {
        entries: {
          include: {
            task: { select: { id: true, taskCode: true, title: true } },
          },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDailyReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            department: true,
            teamLead: { select: { id: true, fullName: true, email: true } },
            manager: { select: { id: true, fullName: true, email: true } },
          },
        },
        entries: {
          include: {
            task: { select: { id: true, taskCode: true, title: true, status: true } },
          },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, email: true, jobTitle: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        revisionHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      res.status(404).json({ success: false, error: "Not Found", message: "Daily report not found" });
      return;
    }

    // Access Scope Verification
    const allowed = await canAccessEmployee(user, report.userId);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You are not authorized to view this daily report",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...report,
        reportingDate: report.reportingDate.toISOString().split("T")[0],
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function saveDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = saveReportSchema.parse(req.body);

    const reportDate = new Date(data.reportingDate);
    reportDate.setUTCHours(0, 0, 0, 0);

    // Validate time entries if present
    for (const entry of data.entries) {
      if (entry.startTime && entry.endTime) {
        const [startH, startM] = entry.startTime.split(":").map(Number);
        const [endH, endM] = entry.endTime.split(":").map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        if (endMins < startMins && entry.hoursSpent === undefined) {
          // Allowed only if spanning midnight is noted, but validate reasonable values
        }
      }
    }

    // Find existing report for this employee & date
    let report = await prisma.dailyReport.findUnique({
      where: {
        user_date_unique: {
          userId: user.id,
          reportingDate: reportDate,
        },
      },
      include: { entries: true },
    });

    if (report && report.status === ReportStatus.APPROVED) {
      res.status(400).json({
        success: false,
        error: "Already Approved",
        message: "This report has already been reviewed and approved. It cannot be modified.",
      });
      return;
    }

    const isSubmitting = data.status === "SUBMITTED";

    const saved = await prisma.$transaction(async (tx) => {
      let activeReportId: string;

      if (report) {
        activeReportId = report.id;
        await tx.dailyReport.update({
          where: { id: report.id },
          data: {
            status: isSubmitting ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
            submittedAt: isSubmitting ? new Date() : report.submittedAt,
          },
        });

        // Delete old entries to replace with new set
        await tx.dailyWorkEntry.deleteMany({
          where: { dailyReportId: report.id },
        });
      } else {
        const created = await tx.dailyReport.create({
          data: {
            userId: user.id,
            reportingDate: reportDate,
            status: isSubmitting ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
            submittedAt: isSubmitting ? new Date() : null,
          },
        });
        activeReportId = created.id;
      }

      // Create entries
      await tx.dailyWorkEntry.createMany({
        data: data.entries.map((e) => ({
          dailyReportId: activeReportId,
          taskId: e.taskId || null,
          activityTitle: e.activityTitle,
          description: e.description,
          startTime: e.startTime || null,
          endTime: e.endTime || null,
          hoursSpent: e.hoursSpent !== undefined ? e.hoursSpent : null,
          progressPercentage: e.progressPercentage || 0,
          status: e.status || "IN_PROGRESS",
          deliverables: e.deliverables || null,
          blockers: e.blockers || null,
          supportRequired: e.supportRequired || null,
          nextDayPlan: e.nextDayPlan || null,
        })),
      });

      // Sync linked tasks so task updates from yesterday/past days stay visible today and next week
      for (const e of data.entries) {
        if (e.taskId) {
          const existingTask = await tx.task.findUnique({ where: { id: e.taskId } });
          if (existingTask) {
            const mappedStatus =
              e.status === "COMPLETED"
                ? "COMPLETED"
                : e.status === "BLOCKED"
                ? "BLOCKED"
                : "IN_PROGRESS";

            await tx.task.update({
              where: { id: e.taskId },
              data: {
                progressPercentage:
                  e.progressPercentage !== undefined
                    ? e.progressPercentage
                    : existingTask.progressPercentage,
                status: mappedStatus as any,
              },
            });

            await tx.taskHistory.create({
              data: {
                taskId: e.taskId,
                userId: user.id,
                action: "TASK_SHEET_UPDATED",
                previousValue: `${existingTask.status} (${existingTask.progressPercentage}%)`,
                newValue: `${mappedStatus} (${e.progressPercentage ?? existingTask.progressPercentage}%)`,
                details: `Task sheet update for ${data.reportingDate}: ${e.activityTitle} - ${e.description}`,
              },
            });
          }
        }
      }

      // If submitting, notify Team Lead
      if (isSubmitting) {
        if (user.teamLeadId) {
          await tx.notification.create({
            data: {
              recipientId: user.teamLeadId,
              senderId: user.id,
              eventType: "REPORT_SUBMITTED",
              title: "Daily Report Submitted",
              message: `${user.fullName} submitted their daily report for ${data.reportingDate}.`,
              link: `/reports/${activeReportId}`,
            },
          });
        } else {
          // Exception: No assigned Team Lead! Notify Super Admin
          const superAdmin = await tx.user.findFirst({
            where: { role: Role.SUPER_ADMIN, isActive: true },
          });
          if (superAdmin) {
            await tx.notification.create({
              data: {
                recipientId: superAdmin.id,
                senderId: user.id,
                eventType: "EXCEPTION_NO_TEAM_LEAD",
                title: "Report Exception: Unassigned Team Lead",
                message: `Employee ${user.fullName} submitted a report but has no assigned Team Lead.`,
                link: `/reports/${activeReportId}`,
              },
            });
          }
        }
      }

      return activeReportId;
    });

    await logAuditEvent({
      userId: user.id,
      action: isSubmitting ? "REPORT_SUBMITTED" : "REPORT_DRAFT_SAVED",
      resourceType: "DAILY_REPORT",
      resourceId: saved,
      details: { reportingDate: data.reportingDate, entriesCount: data.entries.length },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: isSubmitting ? "Daily report submitted for review" : "Daily report draft saved",
      data: { id: saved },
    });
  } catch (err) {
    next(err);
  }
}

export async function resubmitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason, entries } = z
      .object({
        reason: z.string().optional(),
        entries: z.array(workEntrySchema).min(1),
      })
      .parse(req.body);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!report) {
      res.status(404).json({ success: false, error: "Not Found", message: "Report not found" });
      return;
    }

    if (report.userId !== user.id) {
      res.status(403).json({ success: false, error: "Forbidden", message: "Cannot resubmit another employee's report" });
      return;
    }

    if (report.status !== ReportStatus.REVISION_REQUESTED && report.status !== ReportStatus.DRAFT) {
      res.status(400).json({
        success: false,
        error: "Invalid State",
        message: "Only reports with requested revisions or drafts can be resubmitted",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Save revision history snapshot
      const revisionCount = await tx.reportRevisionHistory.count({ where: { dailyReportId: id } });
      await tx.reportRevisionHistory.create({
        data: {
          dailyReportId: id,
          revisionNumber: revisionCount + 1,
          snapshotJson: JSON.stringify(report.entries),
          reason: reason || "Employee updated report following review feedback",
        },
      });

      // 2. Replace entries
      await tx.dailyWorkEntry.deleteMany({ where: { dailyReportId: id } });
      await tx.dailyWorkEntry.createMany({
        data: entries.map((e) => ({
          dailyReportId: id,
          taskId: e.taskId || null,
          activityTitle: e.activityTitle,
          description: e.description,
          startTime: e.startTime || null,
          endTime: e.endTime || null,
          hoursSpent: e.hoursSpent !== undefined ? e.hoursSpent : null,
          progressPercentage: e.progressPercentage || 0,
          status: e.status || "IN_PROGRESS",
          deliverables: e.deliverables || null,
          blockers: e.blockers || null,
          supportRequired: e.supportRequired || null,
          nextDayPlan: e.nextDayPlan || null,
        })),
      });

      // 3. Update status to SUBMITTED
      await tx.dailyReport.update({
        where: { id },
        data: {
          status: ReportStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      // 4. Notify Team Lead
      if (user.teamLeadId) {
        await tx.notification.create({
          data: {
            recipientId: user.teamLeadId,
            senderId: user.id,
            eventType: "REPORT_RESUBMITTED",
            title: "Revised Report Submitted",
            message: `${user.fullName} resubmitted their daily report for review.`,
            link: `/reports/${id}`,
          },
        });
      }
    });

    await logAuditEvent({
      userId: user.id,
      action: "REPORT_RESUBMITTED",
      resourceType: "DAILY_REPORT",
      resourceId: id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Revised report submitted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function exportDailyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { startDate, endDate, employeeId, departmentId, status } = req.query;

    const where: any = {};

    let targetUser: any = null;
    if (employeeId && employeeId !== "ALL" && employeeId !== "all") {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(employeeId) },
            { employeeId: String(employeeId) }
          ]
        },
        include: { department: true }
      });

      if (!targetUser) {
        res.status(404).json({ success: false, error: "NotFound", message: "Employee not found" });
        return;
      }

      if (!isSuperAdmin(user) && user.id !== targetUser.id) {
        const canAccess = await canAccessEmployee(user, targetUser.id);
        if (!canAccess) {
          res.status(403).json({ success: false, error: "Forbidden", message: "Access denied to employee reports" });
          return;
        }
      }

      where.userId = targetUser.id;
    } else {
      if (isSuperAdmin(user)) {
        if (departmentId) where.user = { departmentId: String(departmentId) };
      } else if (isManager(user)) {
        const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
        where.user = { departmentId: { in: allowedDepts } };
      } else if (isTeamLead(user)) {
        where.user = {
          OR: [
            { teamLeadId: user.id },
            { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
            { id: user.id },
          ],
        };
      } else {
        where.userId = user.id;
      }
    }

    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }

    if (startDate || endDate) {
      where.reportingDate = {};
      if (startDate) where.reportingDate.gte = new Date(String(startDate));
      if (endDate) where.reportingDate.lte = new Date(String(endDate));
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: { select: { fullName: true, employeeId: true, department: { select: { name: true } } } },
        entries: {
          include: {
            task: { select: { taskCode: true, title: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        reviews: {
          include: { reviewer: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [
        { reportingDate: "desc" },
        { createdAt: "desc" }
      ]
    });

    const csvHeaders = "ReportingDate,EmployeeID,FullName,Department,ReportStatus,SubmittedAt,ActivityNumber,ActivityTitle,Description,HoursSpent,ProgressPercent,TaskCode,Deliverables,Blockers,SupportRequired,NextDayPlan,ReviewStatus,Reviewer,ReviewComments\n";

    const rows: string[] = [];

    for (const r of reports) {
      const dateStr = r.reportingDate.toISOString().split("T")[0];
      const submittedStr = r.submittedAt ? r.submittedAt.toISOString() : "Not Submitted";
      const review = r.reviews[0];
      const reviewStatus = review?.reviewStatus || "PENDING";
      const reviewerName = review?.reviewer?.fullName || "None";
      const reviewFeedback = (review?.comments || "").replace(/"/g, '""');

      if (!r.entries || r.entries.length === 0) {
        rows.push(
          `"${dateStr}","${r.user.employeeId}","${r.user.fullName}","${r.user.department?.name || "None"}","${r.status}","${submittedStr}",0,"No entries","No activity logged",0,0,"","","","","","${reviewStatus}","${reviewerName}","${reviewFeedback}"`
        );
      } else {
        r.entries.forEach((e, idx) => {
          const actTitle = (e.activityTitle || "").replace(/"/g, '""');
          const actDesc = (e.description || "").replace(/"/g, '""');
          const hours = e.hoursSpent !== null && e.hoursSpent !== undefined ? e.hoursSpent : "Unlogged";
          const prog = e.progressPercentage || 0;
          const taskCode = (e.task?.taskCode || "").replace(/"/g, '""');
          const deliv = (e.deliverables || "").replace(/"/g, '""');
          const block = (e.blockers || "").replace(/"/g, '""');
          const supp = (e.supportRequired || "").replace(/"/g, '""');
          const nextPlan = (e.nextDayPlan || "").replace(/"/g, '""');

          rows.push(
            `"${dateStr}","${r.user.employeeId}","${r.user.fullName}","${r.user.department?.name || "None"}","${r.status}","${submittedStr}",${idx + 1},"${actTitle}","${actDesc}","${hours}",${prog},"${taskCode}","${deliv}","${block}","${supp}","${nextPlan}","${reviewStatus}","${reviewerName}","${reviewFeedback}"`
          );
        });
      }
    }

    const safePersonName = targetUser ? targetUser.fullName.replace(/[^a-zA-Z0-9]/g, "_") : "All_Employees";
    const dateRangeStr = startDate && endDate ? `${startDate}_to_${endDate}` : "all_records";
    const filename = `syncspace_reports_${safePersonName}_${dateRangeStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvHeaders + rows.join("\n"));
  } catch (err) {
    next(err);
  }
}

export async function getDailyReportsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { startDate, endDate, employeeId, departmentId } = req.query;

    const where: any = {};

    let targetUser: any = null;
    if (employeeId && employeeId !== "ALL" && employeeId !== "all") {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(employeeId) },
            { employeeId: String(employeeId) }
          ]
        },
        include: { department: true }
      });

      if (!targetUser) {
        res.status(404).json({ success: false, error: "NotFound", message: "Employee not found" });
        return;
      }

      if (!isSuperAdmin(user) && user.id !== targetUser.id) {
        const canAccess = await canAccessEmployee(user, targetUser.id);
        if (!canAccess) {
          res.status(403).json({ success: false, error: "Forbidden", message: "Access denied to employee reports" });
          return;
        }
      }

      where.userId = targetUser.id;
    } else {
      if (isSuperAdmin(user)) {
        if (departmentId) where.user = { departmentId: String(departmentId) };
      } else if (isManager(user)) {
        const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
        where.user = { departmentId: { in: allowedDepts } };
      } else if (isTeamLead(user)) {
        where.user = {
          OR: [
            { teamLeadId: user.id },
            { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
            { id: user.id },
          ],
        };
      } else {
        where.userId = user.id;
      }
    }

    if (startDate || endDate) {
      where.reportingDate = {};
      if (startDate) where.reportingDate.gte = new Date(String(startDate));
      if (endDate) where.reportingDate.lte = new Date(String(endDate));
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, employeeId: true, department: { select: { name: true } } } },
        entries: {
          include: {
            task: { select: { taskCode: true, title: true } }
          }
        },
        reviews: {
          include: { reviewer: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { reportingDate: "desc" }
    });

    const totalReports = reports.length;
    let submittedReports = 0;
    let approvedReports = 0;
    let revisionRequestedReports = 0;
    let draftReports = 0;
    let underReviewReports = 0;

    let totalActivities = 0;
    let completedActivities = 0;
    let inProgressActivities = 0;
    let totalHoursRecorded = 0;
    let totalBlockers = 0;

    const activityTitlesMap: Record<string, { count: number; totalHours: number }> = {};
    const recentBlockers: Array<{ date: string; employeeName: string; title: string; blocker: string }> = [];

    reports.forEach((r) => {
      if (r.status === "APPROVED") approvedReports++;
      else if (r.status === "SUBMITTED") submittedReports++;
      else if (r.status === "REVISION_REQUESTED") revisionRequestedReports++;
      else if (r.status === "DRAFT") draftReports++;
      else if (r.status === "UNDER_REVIEW") underReviewReports++;

      const dateStr = r.reportingDate.toISOString().split("T")[0];

      r.entries.forEach((e) => {
        totalActivities++;
        if (e.progressPercentage >= 100 || e.status === "COMPLETED") {
          completedActivities++;
        } else {
          inProgressActivities++;
        }

        if (e.hoursSpent && e.hoursSpent > 0) {
          totalHoursRecorded += e.hoursSpent;
        }

        if (e.blockers && e.blockers.trim().length > 0) {
          totalBlockers++;
          if (recentBlockers.length < 10) {
            recentBlockers.push({
              date: dateStr,
              employeeName: r.user.fullName,
              title: e.activityTitle,
              blocker: e.blockers
            });
          }
        }

        const normTitle = e.activityTitle.trim();
        if (normTitle) {
          if (!activityTitlesMap[normTitle]) {
            activityTitlesMap[normTitle] = { count: 0, totalHours: 0 };
          }
          activityTitlesMap[normTitle].count++;
          if (e.hoursSpent) activityTitlesMap[normTitle].totalHours += e.hoursSpent;
        }
      });
    });

    const topActivities = Object.entries(activityTitlesMap)
      .map(([title, stats]) => ({ title, count: stats.count, totalHours: Math.round(stats.totalHours * 10) / 10 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgHoursPerReport = totalReports > 0 ? Math.round((totalHoursRecorded / totalReports) * 10) / 10 : 0;
    const complianceRate = totalReports > 0 ? Math.round(((submittedReports + approvedReports) / totalReports) * 100) : 0;

    const personLabel = targetUser ? `${targetUser.fullName} (${targetUser.employeeId})` : "Company-wide workforce";
    const periodLabel = startDate && endDate ? `from ${startDate} to ${endDate}` : "across all recorded dates";
    const executiveSummaryText = `${personLabel} has ${totalReports} task sheet(s) logged ${periodLabel}. Total recorded productive hours stand at ${totalHoursRecorded.toFixed(1)}h (averaging ${avgHoursPerReport}h/sheet) across ${totalActivities} distinct activity entries. ${completedActivities} activities are finalized (100%), while ${inProgressActivities} remain ongoing. Review status: ${approvedReports} approved, ${revisionRequestedReports} requiring revision, and ${submittedReports + underReviewReports} pending evaluation. ${totalBlockers > 0 ? `${totalBlockers} operational blocker(s) were flagged and documented.` : "Zero active blockers were encountered."}`;

    res.json({
      success: true,
      data: {
        scope: targetUser ? "SINGLE_PERSON" : "ALL_EMPLOYEES",
        targetUser: targetUser ? {
          id: targetUser.id,
          fullName: targetUser.fullName,
          employeeId: targetUser.employeeId,
          jobTitle: targetUser.jobTitle,
          email: targetUser.email,
          department: targetUser.department ? { name: targetUser.department.name, code: targetUser.department.code } : null
        } : null,
        metrics: {
          totalReports,
          submittedReports,
          approvedReports,
          revisionRequestedReports,
          draftReports,
          underReviewReports,
          totalActivities,
          completedActivities,
          inProgressActivities,
          totalHoursRecorded: Math.round(totalHoursRecorded * 10) / 10,
          avgHoursPerReport,
          totalBlockers,
          complianceRate
        },
        topActivities,
        recentBlockers,
        statusDistribution: {
          APPROVED: approvedReports,
          SUBMITTED: submittedReports,
          UNDER_REVIEW: underReviewReports,
          REVISION_REQUESTED: revisionRequestedReports,
          DRAFT: draftReports
        },
        executiveSummaryText
      }
    });
  } catch (err) {
    next(err);
  }
}

