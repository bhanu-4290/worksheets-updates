import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation Error",
      message: "One or more request parameters failed validation",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      error: "Conflict",
      message: `A record with this ${err.meta?.target ? err.meta.target.join(", ") : "value"} already exists.`,
    });
    return;
  }

  // Prisma record not found
  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      error: "Not Found",
      message: "The requested record was not found.",
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error occurred"
      : err.message || "An unexpected server error occurred";

  res.status(statusCode).json({
    success: false,
    error: err.name || "ServerError",
    message,
  });
}
