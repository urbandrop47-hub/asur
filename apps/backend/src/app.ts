import express from "express";
import cors from "cors";
import { apiRouter } from "./routes";
import { errorHandlerMiddleware } from "./middlewares/error-handler";
import { notFoundMiddleware } from "./middlewares/not-found";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        service: "asur-backend",
        status: "ok",
        timestamp: new Date().toISOString()
      }
    });
  });

  app.use(apiRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
