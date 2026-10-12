import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.id },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: user.id, isRead: false },
    });

    res.json({
      success: true,
      data: {
        unreadCount,
        notifications,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, recipientId: user.id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;

    await prisma.notification.updateMany({
      where: { recipientId: user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
}
