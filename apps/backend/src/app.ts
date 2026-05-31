import express from "express";
import type { Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes";
import { swaggerSpec } from "./config/swagger";
import { errorHandlerMiddleware } from "./middlewares/error-handler";
import { notFoundMiddleware } from "./middlewares/not-found";
import { env, hasMongoConnection } from "./config/env";

const ALLOWED_ORIGINS =
  env.NODE_ENV === "production"
    ? [
        "https://asur.in",
        "https://www.asur.in",
        "https://admin.asur.in",
        "https://vendor.asur.in"
      ]
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
      ];

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow server-to-server requests (no Origin header) and listed origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true
    })
  );
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
