import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "worktrack-secure-enterprise-jwt-secret-2026";
const JWT_EXPIRES_IN = "24h";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  employeeId: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "worktrack_auth_token";

export function getCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    path: "/",
  });
}
