import express from "express";
import type { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { apiRouter } from "./routes";
import { swaggerSpec } from "./config/swagger";
import { errorHandlerMiddleware } from "./middlewares/error-handler";
import { notFoundMiddleware } from "./middlewares/not-found";
import { env, hasMongoConnection } from "./config/env";
import { logger } from "./lib/logger";
import { Sentry } from "./lib/sentry";

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

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts, please wait before retrying." }
});

const paymentLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many payment requests, please slow down." }
});

const startTime = Date.now();

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://checkout.razorpay.com",
            "https://cdn.razorpay.com",
            "https://www.gstatic.com",
            "https://apis.google.com"
          ],
          frameSrc: [
            "'self'",
            "https://api.razorpay.com",
            "https://checkout.razorpay.com"
          ],
          connectSrc: [
            "'self'",
            "https://api.razorpay.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://firebaseapp.com",
            ...(process.env.R2_PUBLIC_URL ? [process.env.R2_PUBLIC_URL] : [])
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.razorpay.com",
            ...(process.env.R2_PUBLIC_URL ? [process.env.R2_PUBLIC_URL] : [])
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null
        }
      },
      crossOriginEmbedderPolicy: false // Razorpay needs this off
    })
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true
    })
  );

  // Structured request logging
  app.use(
    pinoHttp({
      logger,
      customLogLevel(_req, res) {
        if (res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      customSuccessMessage(req, res) {
        return `${req.method} ${req.url} ${res.statusCode}`;
      }
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Apply global rate limit to all API routes
  app.use("/api", globalLimiter);

  // Stricter limits on sensitive routes
  app.use("/api/v1/auth/session", authLimiter);
  app.use("/api/v1/payments", paymentLimiter);

  // Enhanced health check (T4)
  app.get("/health", async (_req, res) => {
    let dbLatencyMs: number | null = null;
    let dbStatus = "disconnected";

    if (hasMongoConnection && mongoose.connection.readyState === 1) {
      try {
        const t0 = Date.now();
        await mongoose.connection.db!.admin().ping();
        dbLatencyMs = Date.now() - t0;
        dbStatus = "connected";
      } catch {
        dbStatus = "error";
      }
    } else if (!hasMongoConnection) {
      dbStatus = "in-memory";
    }

    res.json({
      success: true,
      data: {
        service: "asur-backend",
        status: "ok",
        version: process.env.npm_package_version ?? "0.1.0",
        env: env.NODE_ENV,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        timestamp: new Date().toISOString()
      }
    });
  });

  // Swagger UI
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ASUR API Docs",
    swaggerOptions: { persistAuthorization: true }
  }));

  // API routes
  app.use(apiRouter);
  app.use(notFoundMiddleware);

  // Sentry captures unhandled errors (must come after routes, before our handler)
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  app.use(errorHandlerMiddleware);

  return app;
}
