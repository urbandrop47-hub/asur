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

  // markRead returns false when modifiedCount=0, which happens both when the
  // notification doesn't exist AND when it's already read. Check existence to
  // distinguish the two: already-read is idempotent success; missing is 404.
  const modified = await notificationRepository.markRead(id, userId);
  if (!modified) {
    const exists = await notificationRepository.existsForUser(id, userId);
    if (!exists) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }
    // Already read — treat as success (idempotent)
  }

  res.json({ success: true });
});

export const markAllNotificationsReadController: RequestHandler = asyncHandler(async (_req, res) => {
  const userId: string = res.locals.user.id;
  const count = await notificationRepository.markAllRead(userId);

  res.json({ success: true, data: { markedRead: count } });
});
