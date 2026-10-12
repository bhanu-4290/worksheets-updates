import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(5, "Content must be at least 5 characters"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetScope: z.enum(["ALL", "DEPARTMENT", "TEAM"]).default("ALL"),
  departmentId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().default(false),
});

export async function getAnnouncements(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  // Fetch user's department and teams for scope filtering
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      teamMemberships: true,
    },
  });

  const userDeptId = userProfile?.departmentId;
  const userTeamIds = userProfile?.teamMemberships.map((tm) => tm.teamId) || [];

  let whereClause: any = {};

  if (user.role === "SUPER_ADMIN") {
    // Super Admin sees all announcements
    whereClause = {};
  } else {
    // Other users see:
    // 1. Company-wide (targetScope: "ALL")
    // 2. Department-specific (targetScope: "DEPARTMENT" and departmentId = user's dept)
    // 3. Team-specific (targetScope: "TEAM" and teamId IN user's teams)
    whereClause = {
      OR: [
        { targetScope: "ALL" },
        ...(userDeptId ? [{ targetScope: "DEPARTMENT", departmentId: userDeptId }] : []),
        ...(userTeamIds.length > 0 ? [{ targetScope: "TEAM", teamId: { in: userTeamIds } }] : []),
      ],
    };
  }

  const announcements = await prisma.announcement.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          role: true,
          jobTitle: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: announcements,
  });
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const parsed = createAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "ValidationError",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { title, content, priority, targetScope, departmentId, teamId, isPinned } = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      priority,
      targetScope,
      departmentId: departmentId || null,
      teamId: teamId || null,
      isPinned: isPinned || false,
      authorId: user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Create notifications for targeted users
  let recipients: { id: string }[] = [];
  if (targetScope === "ALL") {
    recipients = await prisma.user.findMany({
      where: { isActive: true, id: { not: user.id } },
      select: { id: true },
    });
  } else if (targetScope === "DEPARTMENT" && departmentId) {
    recipients = await prisma.user.findMany({
      where: { isActive: true, departmentId, id: { not: user.id } },
      select: { id: true },
    });
  } else if (targetScope === "TEAM" && teamId) {
    recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: user.id },
        teamMemberships: { some: { teamId } },
      },
      select: { id: true },
    });
  }

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        recipientId: r.id,
        senderId: user.id,
        eventType: "NEW_ANNOUNCEMENT",
        title: `Announcement: ${title}`,
        message: content.length > 100 ? content.substring(0, 97) + "..." : content,
        link: "/announcements",
      })),
    });
  }

  res.status(201).json({
    success: true,
    data: announcement,
  });
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    res.status(404).json({ success: false, error: "NotFound", message: "Announcement not found." });
    return;
  }

  // Only Super Admin or original author can delete
  if (user.role !== "SUPER_ADMIN" && announcement.authorId !== user.id) {
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "You can only delete announcements you authored.",
    });
    return;
  }

  await prisma.announcement.delete({ where: { id } });

  res.json({
    success: true,
    message: "Announcement deleted successfully.",
  });
}

export async function togglePin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    res.status(404).json({ success: false, error: "NotFound", message: "Announcement not found." });
    return;
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
  });

  res.json({
    success: true,
    data: updated,
  });
}
