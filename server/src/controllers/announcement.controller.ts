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

export async function checkAndTriggerBirthdays(): Promise<void> {
  try {
    const now = new Date();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();
    const localMonth = now.getMonth();
    const localDate = now.getDate();
    const currentYear = now.getFullYear();

    const activeUsersWithDob = await prisma.user.findMany({
      where: {
        isActive: true,
        dateOfBirth: { not: null },
      },
    });

    if (activeUsersWithDob.length === 0) return;

    // Filter users whose birthday is today (comparing month and date)
    const birthdayUsers = activeUsersWithDob.filter((u) => {
      if (!u.dateOfBirth) return false;
      const dob = new Date(u.dateOfBirth);
      const dobUtcMonth = dob.getUTCMonth();
      const dobUtcDate = dob.getUTCDate();
      const dobLocalMonth = dob.getMonth();
      const dobLocalDate = dob.getDate();

      return (
        (dobUtcMonth === utcMonth && dobUtcDate === utcDate) ||
        (dobLocalMonth === localMonth && dobLocalDate === localDate)
      );
    });

    if (birthdayUsers.length === 0) return;

    // Retrieve Super Admin as the official wishes sender
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN", isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const startOfYear = new Date(currentYear, 0, 1);

    for (const bUser of birthdayUsers) {
      const birthdayTitle = `🎉 Happy Birthday, ${bUser.fullName}!`;

      // Verify if birthday announcement was already published this calendar year
      const existingAnnouncement = await prisma.announcement.findFirst({
        where: {
          title: birthdayTitle,
          createdAt: { gte: startOfYear },
        },
      });

      if (!existingAnnouncement) {
        const senderId = superAdmin ? superAdmin.id : bUser.id;

        // 1. Company-wide celebration announcement
        await prisma.announcement.create({
          data: {
            title: birthdayTitle,
            content: `Today the entire WorkTrack family celebrates ${bUser.fullName} (${bUser.jobTitle}) on their birthday! 🎂🎈✨\n\nWishing you boundless happiness, great health, and continued success. Have a truly wonderful and memorable day!`,
            priority: "HIGH",
            targetScope: "ALL",
            isPinned: true,
            authorId: senderId,
          },
        });

        // 2. Personal Direct Chat message from Admin
        if (superAdmin && superAdmin.id !== bUser.id) {
          await prisma.chatMessage.create({
            data: {
              senderId: superAdmin.id,
              receiverId: bUser.id,
              content: `🎂 Happy Birthday, ${bUser.fullName}! 🌟 On behalf of the entire management and team, wishing you a joyous birthday and a wonderful year ahead! 🎉`,
            },
          });
        }

        // 3. Direct in-app notification to birthday user
        await prisma.notification.create({
          data: {
            recipientId: bUser.id,
            senderId: superAdmin ? superAdmin.id : null,
            eventType: "BIRTHDAY_WISHES",
            title: `🎂 Happy Birthday from the Team!`,
            message: `Wishing you a wonderful birthday, ${bUser.fullName}! A special celebration announcement has been posted in your honor.`,
            link: "/announcements",
          },
        });

        console.log(`[BIRTHDAY] Automated birthday celebration triggered for ${bUser.fullName} (${bUser.email}).`);
      }
    }
  } catch (err) {
    console.error("[BIRTHDAY] Error in checkAndTriggerBirthdays:", err);
  }
}

export async function getAnnouncements(req: Request, res: Response): Promise<void> {
  // Check and trigger any birthdays for today
  await checkAndTriggerBirthdays();

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
