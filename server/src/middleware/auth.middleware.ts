import { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  employeeId: string;
  email: string;
  fullName: string;
  role: Role;
  jobTitle: string;
  departmentId: string | null;
  managerId: string | null;
  teamLeadId: string | null;
  isActive: boolean;
  managedDepartmentIds: string[];
  ledTeamIds: string[];
  membershipTeamIds: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No authentication token provided",
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "Token has expired or is invalid",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        managedDepartments: { select: { id: true } },
        ledTeams: { select: { id: true } },
        teamMemberships: { select: { teamId: true } },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
        message: "Account does not exist",
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: "Account deactivated",
        message: "Your account has been deactivated. Please contact Super Admin.",
      });
      return;
    }

    req.user = {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      jobTitle: user.jobTitle,
      departmentId: user.departmentId,
      managerId: user.managerId,
      teamLeadId: user.teamLeadId,
      isActive: user.isActive,
      managedDepartmentIds: user.managedDepartments.map((d) => d.id),
      ledTeamIds: user.ledTeams.map((t) => t.id),
      membershipTeamIds: user.teamMemberships.map((m) => m.teamId),
    };

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Authentication error",
      message: "An unexpected error occurred during authentication",
    });
  }
}
