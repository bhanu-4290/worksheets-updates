import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

let prismaInstance: PrismaClient;
let pgliteInstance: PGlite | null = null;

const pgDataDir = process.env.PG_DATA_DIR || path.resolve(process.cwd(), "prisma", "pgdata");

export function getDbClient(): { prisma: PrismaClient; pglite: PGlite | null } {
  if (prismaInstance) {
    return { prisma: prismaInstance, pglite: pgliteInstance };
  }

  // If external postgresql URL is provided and not default localhost fallback
  if (process.env.USE_SYSTEM_POSTGRES === "true" && process.env.DATABASE_URL) {
    prismaInstance = new PrismaClient();
  } else {
    // Zero-friction in-process PostgreSQL 18 engine using PGlite
    if (!fs.existsSync(pgDataDir)) {
      fs.mkdirSync(pgDataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(pgDataDir);
    const adapter = new PrismaPGlite(pgliteInstance);
    prismaInstance = new PrismaClient({ adapter });
  }

  return { prisma: prismaInstance, pglite: pgliteInstance };
}

export async function initDatabase(): Promise<void> {
  const { prisma, pglite } = getDbClient();

  if (pglite) {
    try {
      // Check if users table exists
      const res = await pglite.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users';");
      if (res.rows.length === 0) {
        console.log("[DB] Initializing PostgreSQL schema from migration.sql...");
        const migrationPath = path.resolve(process.cwd(), "prisma", "migrations", "20261009000000_init", "migration.sql");
        if (fs.existsSync(migrationPath)) {
          const sql = fs.readFileSync(migrationPath, "utf8");
          await pglite.exec(sql);
        }
      }

      // Ensure chat_messages and announcements tables exist
      await pglite.exec(`
        CREATE TABLE IF NOT EXISTS "chat_messages" (
            "id" TEXT NOT NULL,
            "senderId" TEXT NOT NULL,
            "receiverId" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "chat_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "chat_messages_senderId_receiverId_idx" ON "chat_messages"("senderId", "receiverId");
        CREATE INDEX IF NOT EXISTS "chat_messages_receiverId_isRead_idx" ON "chat_messages"("receiverId", "isRead");

        CREATE TABLE IF NOT EXISTS "announcements" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "priority" TEXT NOT NULL DEFAULT 'NORMAL',
            "targetScope" TEXT NOT NULL DEFAULT 'ALL',
            "departmentId" TEXT,
            "teamId" TEXT,
            "isPinned" BOOLEAN NOT NULL DEFAULT false,
            "authorId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "announcements_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "announcements_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "announcements_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        -- Ensure dateOfBirth column exists on users table
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
      `);
      console.log("[DB] PostgreSQL schema is ready (with Chat, Announcements & Date of Birth).");
    } catch (err) {
      console.error("[DB] Error checking/applying schema:", err);
      throw err;
    }
  }
}

export const prisma = getDbClient().prisma;
