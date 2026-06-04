import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { notificationRepository } from "../repositories/notification.repository";

export const listNotificationsController: RequestHandler = asyncHandler(async (_req, res) => {
  const userId: string = res.locals.user.id;
  const notifications = await notificationRepository.listForUser(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  res.json({ success: true, data: { notifications, unreadCount } });
});

export const markNotificationReadController: RequestHandler = asyncHandler(async (req, res) => {
  const userId: string = res.locals.user.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const updated = await notificationRepository.markRead(id, userId);
  if (!updated) {
    res.status(404).json({ success: false, message: "Notification not found" });
    return;
  }

  res.json({ success: true });
});

export const markAllNotificationsReadController: RequestHandler = asyncHandler(async (_req, res) => {
  const userId: string = res.locals.user.id;
  const count = await notificationRepository.markAllRead(userId);

  res.json({ success: true, data: { markedRead: count } });
});
