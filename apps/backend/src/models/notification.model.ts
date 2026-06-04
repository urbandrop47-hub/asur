import { Schema, model, models } from "mongoose";

export type NotificationType =
  | "order_update"
  | "back_in_stock"
  | "drop_launch"
  | "promo"
  | "loyalty";

export type NotificationDoc = {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["order_update", "back_in_stock", "drop_launch", "promo", "loyalty"]
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel =
  models.Notification ?? model<NotificationDoc>("Notification", notificationSchema);
