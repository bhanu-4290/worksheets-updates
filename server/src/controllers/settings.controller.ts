import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { logAuditEvent } from "../utils/audit.js";

const settingsSchema = z.object({
  companyName: z.string().min(2),
  timezone: z.string().min(2),
  workDays: z.string().min(2),
  submissionDeadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  gracePeriodHours: z.number().min(0).max(12),
  allowMidnightEntries: z.boolean().default(true),
});

const holidaySchema = z.object({
  name: z.string().min(2),
  date: z.string(), // YYYY-MM-DD
  isRecurring: z.boolean().default(false),
});

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await prisma.companySetting.findFirst();
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          companyName: "WorkTrack Enterprise",
          timezone: "UTC",
          workDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
          submissionDeadlineTime: "19:00",
          gracePeriodHours: 2,
          allowMidnightEntries: true,
        },
      });
    }

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });

    res.json({
      success: true,
      data: {
        settings,
        holidays,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = settingsSchema.parse(req.body);

    let settings = await prisma.companySetting.findFirst();
    if (!settings) {
      settings = await prisma.companySetting.create({ data });
    } else {
      settings = await prisma.companySetting.update({
        where: { id: settings.id },
        data,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "SETTINGS_UPDATED",
      resourceType: "COMPANY_SETTINGS",
      details: data,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Company settings updated successfully",
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

export async function addHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = holidaySchema.parse(req.body);

    const holiday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        isRecurring: data.isRecurring,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "HOLIDAY_ADDED",
      resourceType: "HOLIDAY",
      details: data,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      data: holiday,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    await prisma.holiday.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "HOLIDAY_DELETED",
      resourceType: "HOLIDAY",
      resourceId: id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
