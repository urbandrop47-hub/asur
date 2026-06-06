import { randomBytes } from "crypto";
import { NewsletterSubscriberModel } from "../models/newsletter-subscriber.model";
import type { NewsletterSubscriberDoc } from "../models/newsletter-subscriber.model";

function token(): string {
  return randomBytes(24).toString("hex");
}

export const newsletterRepository = {
  async subscribe(email: string, source: "footer" | "popup" | "checkout"): Promise<{
    doc: NewsletterSubscriberDoc;
    isNew: boolean;
  }> {
    const existing = (await NewsletterSubscriberModel.findOne({ email: email.toLowerCase() }).lean()) as unknown as NewsletterSubscriberDoc | null;
    if (existing) {
      if (existing.unsubscribedAt) {
        // re-subscribe: clear unsubscribed, reset confirm
        await NewsletterSubscriberModel.updateOne(
          { email: email.toLowerCase() },
          {
            $unset: { unsubscribedAt: 1, confirmedAt: 1 },
            $set: { confirmToken: token(), source, updatedAt: new Date() },
          }
        );
        const updated = (await NewsletterSubscriberModel.findOne({ email: email.toLowerCase() }).lean()) as unknown as NewsletterSubscriberDoc;
        return { doc: updated, isNew: false };
      }
      return { doc: existing, isNew: false };
    }

    const now = new Date();
    const doc = await NewsletterSubscriberModel.create({
      email: email.toLowerCase(),
      source,
      confirmToken: token(),
      unsubscribeToken: token(),
      subscribedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { doc: doc.toObject(), isNew: true };
  },

  async confirm(confirmToken: string): Promise<NewsletterSubscriberDoc | null> {
    // Tokens older than 24 h are considered expired — re-subscribe to get a fresh link.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const doc = await NewsletterSubscriberModel.findOneAndUpdate(
      {
        confirmToken,
        unsubscribedAt: { $exists: false },
        confirmedAt: { $exists: false },   // idempotent — don't re-confirm already confirmed
        createdAt: { $gte: cutoff },       // 24-h TTL
      },
      { $set: { confirmedAt: new Date(), updatedAt: new Date() } },
      { new: true }
    ).lean();
    return doc as unknown as NewsletterSubscriberDoc | null;
  },

  async unsubscribe(unsubscribeToken: string): Promise<boolean> {
    const res = await NewsletterSubscriberModel.updateOne(
      { unsubscribeToken, unsubscribedAt: { $exists: false } },
      { $set: { unsubscribedAt: new Date(), updatedAt: new Date() } }
    );
    return res.modifiedCount > 0;
  },

  async listConfirmed(page: number, limit: number): Promise<{ docs: NewsletterSubscriberDoc[]; total: number }> {
    const skip = (page - 1) * limit;
    const [rawDocs, total] = await Promise.all([
      NewsletterSubscriberModel.find({ confirmedAt: { $exists: true }, unsubscribedAt: { $exists: false } })
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterSubscriberModel.countDocuments({ confirmedAt: { $exists: true }, unsubscribedAt: { $exists: false } }),
    ]);
    return { docs: rawDocs as unknown as NewsletterSubscriberDoc[], total };
  },

  async stats(): Promise<{ total: number; confirmed: number; unsubscribed: number; pending: number }> {
    const [total, confirmed, unsubscribed] = await Promise.all([
      NewsletterSubscriberModel.countDocuments(),
      NewsletterSubscriberModel.countDocuments({ confirmedAt: { $exists: true }, unsubscribedAt: { $exists: false } }),
      NewsletterSubscriberModel.countDocuments({ unsubscribedAt: { $exists: true } }),
    ]);
    return { total, confirmed, unsubscribed, pending: total - confirmed - unsubscribed };
  },
};
