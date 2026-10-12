import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { logAuditEvent } from "../utils/audit.js";

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    let searchEmail = email.toLowerCase().trim();
    if (!searchEmail.includes("@")) {
      searchEmail = `${searchEmail}@worktrack.company`;
    }
    if (searchEmail === "admin@worktrack.company") {
      searchEmail = "rahul@worktrack.company";
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: searchEmail },
          { email: email.toLowerCase().trim() },
          { employeeId: email.trim().toUpperCase() },
        ],
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        managedDepartments: { select: { id: true, name: true, code: true } },
        ledTeams: { select: { id: true, name: true, code: true } },
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      await logAuditEvent({
        userId: user.id,
        action: "LOGIN_FAILED_DEACTIVATED",
        resourceType: "AUTH",
        ipAddress: req.ip,
      });

      res.status(403).json({
        success: false,
        error: "Account Deactivated",
        message: "Your account is deactivated. Please contact an administrator.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        userId: user.id,
        action: "LOGIN_FAILED_BAD_PASSWORD",
        resourceType: "AUTH",
        ipAddress: req.ip,
      });

      res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    });

    setAuthCookie(res, token);

    await logAuditEvent({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      resourceType: "AUTH",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        token, // Included for authorization header clients / testing
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          fullName: user.fullName,
          jobTitle: user.jobTitle,
          role: user.role,
          department: user.department,
          managedDepartments: user.managedDepartments,
          ledTeams: user.ledTeams,
          teams: user.teamMemberships.map((m) => m.team),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: "LOGOUT",
        resourceType: "AUTH",
        ipAddress: req.ip,
      });
    }

    clearAuthCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        teamLead: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        managedDepartments: { select: { id: true, name: true, code: true } },
        ledTeams: { select: { id: true, name: true, code: true } },
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, error: "Unauthorized", message: "Account inactive or invalid" });
      return;
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: { recipientId: user.id, isRead: false },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          fullName: user.fullName,
          jobTitle: user.jobTitle,
          role: user.role,
          joiningDate: user.joiningDate,
          department: user.department,
          manager: user.manager,
          teamLead: user.teamLead,
          managedDepartments: user.managedDepartments,
          ledTeams: user.ledTeams,
          teams: user.teamMemberships.map((m) => m.team),
          unreadNotificationsCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if not found to prevent user enumeration
      res.json({
        success: true,
        message: "If that email address exists in our system, password reset instructions have been generated.",
      });
      return;
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      resourceType: "AUTH",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password reset instructions generated successfully.",
      // Return resetToken in response for internal testing / development environment
      resetToken: rawToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      res.status(400).json({
        success: false,
        error: "Invalid or expired token",
        message: "The reset link is invalid or has expired.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await logAuditEvent({
      userId: record.userId,
      action: "PASSWORD_RESET_SUCCESS",
      resourceType: "AUTH",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password reset successfully. You may now log in with your new password.",
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: "Invalid password",
        message: "Current password does not match",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAuditEvent({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      resourceType: "AUTH",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
}
