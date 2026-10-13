import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { ReportStatus, ReviewDecision, Role } from "@prisma/client";
import { isSuperAdmin, isManager, isTeamLead } from "../middleware/scope.middleware.js";
import { logAuditEvent } from "../utils/audit.js";

const approveSchema = z.object({
  comments: z.string().optional().default("Acknowledged and approved."),
});

const revisionSchema = z.object({
  comments: z.string().min(5, "Mandatory feedback comment is required when requesting revisions"),
});

export async function getReviewQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { status, search } = req.query;

    const where: any = {};

    // Organizational Scope Filter
    if (isSuperAdmin(user)) {
      // All
    } else if (isManager(user)) {
      const allowedDepts = [user.departmentId, ...user.managedDepartmentIds].filter(Boolean);
      where.user = { departmentId: { in: allowedDepts } };
    } else if (isTeamLead(user)) {
      // Subordinates of the Team Lead
      where.user = {
        OR: [
          { teamLeadId: user.id },
          { teamMemberships: { some: { teamId: { in: user.ledTeamIds } } } },
        ],
      };
      // A team lead should not see their own report in their review queue!
      where.userId = { not: user.id };
    } else {
      res.status(403).json({ success: false, error: "Forbidden", message: "Executives do not have a review queue" });
      return;
    }

    if (status === "ALL") {
      // Show all reports across all statuses
    } else if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    } else {
      // Default to awaiting review
      where.status = { in: [ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW, ReportStatus.REVISION_REQUESTED] };
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
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = reports.map((r) => {
      const recordedHours = r.entries.reduce((sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum), 0);
      const blockerEntries = r.entries.filter((e) => e.blockers && e.blockers.trim().length > 0);

      return {
        id: r.id,
        reportingDate: r.reportingDate.toISOString().split("T")[0],
        status: r.status,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
        user: r.user,
        entriesCount: r.entries.length,
        totalHoursRecorded: recordedHours > 0 ? recordedHours : null,
        blockers: blockerEntries.map((b) => ({
          title: b.activityTitle,
          blocker: b.blockers,
          supportRequired: b.supportRequired,
        })),
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

export async function approveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { reportId } = req.params;
    const { comments } = approveSchema.parse(req.body);

    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          include: { teamMemberships: true },
        },
      },
    });

    if (!report) {
      res.status(404).json({ success: false, error: "Not Found", message: "Daily report not found" });
      return;
    }

    // MANDATORY ACCESS RULE: User cannot approve their own report!
    if (report.userId === user.id) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You cannot approve or review your own daily report",
      });
      return;
    }

    // Check authority: Team Lead or Super Admin
    if (!isSuperAdmin(user)) {
      if (!isTeamLead(user)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only assigned Team Leads or Super Admins can approve daily reports",
        });
        return;
      }

      // Check whether this employee is subordinate to this Team Lead
      const isDirectLead = report.user.teamLeadId === user.id;
      const isInLedTeam = report.user.teamMemberships.some((m) => user.ledTeamIds.includes(m.teamId));

      if (!isDirectLead && !isInLedTeam) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You are not the assigned Team Lead for this employee",
        });
        return;
      }
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.reportReview.create({
        data: {
          dailyReportId: report.id,
          reviewerId: user.id,
          reviewStatus: ReviewDecision.APPROVED,
          comments,
        },
      });

      await tx.dailyReport.update({
        where: { id: report.id },
        data: { status: ReportStatus.APPROVED },
      });

      await tx.notification.create({
        data: {
          recipientId: report.userId,
          senderId: user.id,
          eventType: "REPORT_APPROVED",
          title: "Daily Report Approved",
          message: `${user.fullName} reviewed and approved your daily report for ${report.reportingDate.toISOString().split("T")[0]}.`,
          link: `/reports/${report.id}`,
        },
      });

      return createdReview;
    });

    await logAuditEvent({
      userId: user.id,
      action: "REPORT_APPROVED",
      resourceType: "DAILY_REPORT",
      resourceId: report.id,
      details: { comments, employeeId: report.user.employeeId },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Daily report approved successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

export async function requestRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { reportId } = req.params;
    const { comments } = revisionSchema.parse(req.body);

    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          include: { teamMemberships: true },
        },
      },
    });

    if (!report) {
      res.status(404).json({ success: false, error: "Not Found", message: "Daily report not found" });
      return;
    }

    // MANDATORY ACCESS RULE: User cannot review their own report!
    if (report.userId === user.id) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You cannot request corrections on your own daily report",
      });
      return;
    }

    // Check authority
    if (!isSuperAdmin(user)) {
      if (!isTeamLead(user)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only assigned Team Leads or Super Admins can request revisions",
        });
        return;
      }

      const isDirectLead = report.user.teamLeadId === user.id;
      const isInLedTeam = report.user.teamMemberships.some((m) => user.ledTeamIds.includes(m.teamId));

      if (!isDirectLead && !isInLedTeam) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You are not the assigned Team Lead for this employee",
        });
        return;
      }
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.reportReview.create({
        data: {
          dailyReportId: report.id,
          reviewerId: user.id,
          reviewStatus: ReviewDecision.REVISION_REQUESTED,
          comments,
        },
      });

      await tx.dailyReport.update({
        where: { id: report.id },
        data: { status: ReportStatus.REVISION_REQUESTED },
      });

      await tx.notification.create({
        data: {
          recipientId: report.userId,
          senderId: user.id,
          eventType: "REVISION_REQUESTED",
          title: "Revision Requested on Daily Report",
          message: `${user.fullName} requested revisions on your report: "${comments}"`,
          link: `/reports/${report.id}`,
        },
      });

      return createdReview;
    });

    await logAuditEvent({
      userId: user.id,
      action: "REVISION_REQUESTED",
      resourceType: "DAILY_REPORT",
      resourceId: report.id,
      details: { comments, employeeId: report.user.employeeId },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Revision requested successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
}
