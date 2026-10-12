import { app } from "./app.js";
import { initDatabase, prisma } from "./config/db.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await initDatabase();
    logger.info("Database initialized successfully.");

    const server = app.listen(PORT, () => {
      logger.info(`🚀 WorkTrack API Server running on http://localhost:${PORT}`);
      logger.info(`📖 OpenAPI Swagger Documentation: http://localhost:${PORT}/api-docs`);
    });

    const shutdown = async () => {
      logger.info("Gracefully shutting down WorkTrack server...");
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database disconnected. Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    logger.error("Failed to start WorkTrack server:", err);
    process.exit(1);
  }
}

bootstrap();
