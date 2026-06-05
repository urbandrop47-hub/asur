import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import {
  listNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController
} from "../controllers/notification.controller";

export const notificationRouter: ExpressRouter = Router();

notificationRouter.get("/", requireSession, listNotificationsController);
notificationRouter.patch("/read-all", requireSession, markAllNotificationsReadController);
notificationRouter.patch("/:id/read", requireSession, markNotificationReadController);
