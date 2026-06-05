import { randomBytes } from "crypto";
import { AbandonedCartModel } from "../models/abandoned-cart.model";
import type { AbandonedCartDoc, AbandonedCartItem } from "../models/abandoned-cart.model";

function generateToken(): string {
  return randomBytes(20).toString("hex");
}

export const abandonedCartRepository = {
  async upsert(params: {
    email: string;
    customerId?: string;
    customerName?: string;
    items: AbandonedCartItem[];
    subtotal: number;
  }): Promise<AbandonedCartDoc> {
    const now = new Date();
    const existing = await AbandonedCartModel.findOne({
      email: params.email.toLowerCase(),
      convertedAt: { $exists: false },
    });

    if (existing) {
      existing.items = params.items;
      existing.subtotal = params.subtotal;
      existing.lastActivityAt = now;
      existing.updatedAt = now;
      if (params.customerId) existing.customerId = params.customerId;
      if (params.customerName) existing.customerName = params.customerName;
      await existing.save();
      return existing.toObject();
    }

    const doc = await AbandonedCartModel.create({
      ...params,
      email: params.email.toLowerCase(),
      recoveryToken: generateToken(),
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return doc.toObject();
  },

  async markConverted(email: string): Promise<void> {
    await AbandonedCartModel.updateMany(
      { email: email.toLowerCase(), convertedAt: { $exists: false } },
      { $set: { convertedAt: new Date(), updatedAt: new Date() } }
    );
  },

  async markEmail1Sent(id: string, couponCode?: string): Promise<void> {
    await AbandonedCartModel.findByIdAndUpdate(id, {
      $set: {
        email1SentAt: new Date(),
        ...(couponCode ? { couponCode } : {}),
        updatedAt: new Date(),
      },
    });
  },

  async saveCouponCode(id: string, couponCode: string): Promise<void> {
    await AbandonedCartModel.findByIdAndUpdate(id, {
      $set: { couponCode, updatedAt: new Date() },
    });
  },

  async markEmail2Sent(id: string): Promise<void> {
    await AbandonedCartModel.findByIdAndUpdate(id, {
      $set: { email2SentAt: new Date(), updatedAt: new Date() },
    });
  },

  /** Carts eligible for email 1: active > 1h ago, email1 not yet sent */
  async findForEmail1(): Promise<(AbandonedCartDoc & { _id: string })[]> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const docs = await AbandonedCartModel.find({
      lastActivityAt: { $lte: cutoff },
      email1SentAt: { $exists: false },
      convertedAt: { $exists: false },
    }).lean();
    return docs as unknown as (AbandonedCartDoc & { _id: string })[];
  },

  /** Carts eligible for email 2: email1 sent > 24h ago, email2 not yet sent */
  async findForEmail2(): Promise<(AbandonedCartDoc & { _id: string })[]> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const docs = await AbandonedCartModel.find({
      email1SentAt: { $lte: cutoff },
      email2SentAt: { $exists: false },
      convertedAt: { $exists: false },
    }).lean();
    return docs as unknown as (AbandonedCartDoc & { _id: string })[];
  },

  async findByRecoveryToken(token: string): Promise<AbandonedCartDoc | null> {
    const doc = await AbandonedCartModel.findOne({ recoveryToken: token }).lean();
    return doc as unknown as AbandonedCartDoc | null;
  },
};
