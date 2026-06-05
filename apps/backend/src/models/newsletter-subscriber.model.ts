import { Schema, model, models } from "mongoose";

export type NewsletterSubscriberDoc = {
  email: string;
  source: "footer" | "popup" | "checkout";
  confirmToken: string;
  unsubscribeToken: string;
  subscribedAt: Date;
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const newsletterSubscriberSchema = new Schema<NewsletterSubscriberDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    source: { type: String, enum: ["footer", "popup", "checkout"], required: true, default: "footer" },
    confirmToken: { type: String, required: true, unique: true, index: true },
    unsubscribeToken: { type: String, required: true, unique: true, index: true },
    subscribedAt: { type: Date, required: true, default: () => new Date() },
    confirmedAt: { type: Date },
    unsubscribedAt: { type: Date },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const NewsletterSubscriberModel =
  models.NewsletterSubscriber ??
  model<NewsletterSubscriberDoc>("NewsletterSubscriber", newsletterSubscriberSchema);
