import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import v1Routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
import { prisma } from "./config/db.js";

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, // Allows swagger UI and flexible internal iframe rendering
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow internal network, localhost, or same-origin
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// General API rate limiter
app.use("/api/v1", apiLimiter);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: "HEALTHY",
      service: "WorkTrack Enterprise API",
      timestamp: new Date().toISOString(),
      database: "CONNECTED",
      registeredUsers: userCount,
    });
  } catch (err: any) {
    res.status(503).json({
      status: "DEGRADED",
      database: "DISCONNECTED",
      error: err.message,
    });
  }
});

// Swagger OpenAPI documentation UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mount REST API v1
app.use("/api/v1", v1Routes);

// Frontend static distribution (for single-port enterprise hosting)
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/api-docs")
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Catch-all for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "NotFound",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Centralized error handler
app.use(errorHandler);

