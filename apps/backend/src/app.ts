import express from "express";
import type { Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes";
import { swaggerSpec } from "./config/swagger";
import { errorHandlerMiddleware } from "./middlewares/error-handler";
import { notFoundMiddleware } from "./middlewares/not-found";
import { hasMongoConnection } from "./config/env";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        service: "asur-backend",
        status: "ok",
        database: hasMongoConnection ? "mongodb" : "in-memory",
        timestamp: new Date().toISOString()
      }
    });
  });

  // Swagger UI — available at /api/docs
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ASUR API Docs",
    swaggerOptions: { persistAuthorization: true }
  }));

  // API routes
  app.use(apiRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
