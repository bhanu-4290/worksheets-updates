import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, resourceType, userId, limit = 100 } = req.query;

    const where: any = {};
    if (action) where.action = String(action);
    if (resourceType) where.resourceType = String(resourceType);
    if (userId) where.userId = String(userId);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, employeeId: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}
