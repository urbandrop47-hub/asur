import { NotificationModel, type NotificationDoc, type NotificationType } from "../models/notification.model";

type CreatePayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
};

export const notificationRepository = {
  async create(payload: CreatePayload): Promise<NotificationDoc> {
    const doc = await NotificationModel.create({
      ...payload,
      read: false,
      createdAt: new Date().toISOString()
    });
    return doc.toObject();
  },

  async listForUser(userId: string, limit = 40): Promise<NotificationDoc[]> {
    const docs = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as NotificationDoc[];
  },

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false });
  },

  async markRead(id: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.updateOne(
      { _id: id, userId },
      { $set: { read: true } }
    );
    return result.modifiedCount > 0;
  },

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }
};
