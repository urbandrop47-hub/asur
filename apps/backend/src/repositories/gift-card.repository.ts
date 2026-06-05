import { randomBytes } from "node:crypto";
import { hasMongoConnection } from "../config/env";
import { createId } from "../lib/id";
import { GiftCardModel, type GiftCardDoc } from "../models/gift-card.model";

function generateCode(): string {
  // 16 uppercase alphanumeric chars (no ambiguous chars like 0/O, 1/I/L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(16);
  for (const b of bytes) {
    code += chars[b % chars.length];
    if (code.length === 16) break;
  }
  return code;
}

const mockCards: GiftCardDoc[] = [];

export const giftCardRepository = {
  async findByCode(code: string): Promise<GiftCardDoc | null> {
    const upper = code.toUpperCase().replace(/-/g, "").trim();
    if (hasMongoConnection) {
      return GiftCardModel.findOne({ code: upper }).lean<GiftCardDoc>().exec();
    }
    return mockCards.find((c) => c.code === upper) ?? null;
  },

  async findById(id: string): Promise<GiftCardDoc | null> {
    if (hasMongoConnection) {
      return GiftCardModel.findOne({ id }).lean<GiftCardDoc>().exec();
    }
    return mockCards.find((c) => c.id === id) ?? null;
  },

  async listByPurchaser(customerId: string): Promise<GiftCardDoc[]> {
    if (hasMongoConnection) {
      return GiftCardModel.find({ purchasedBy: customerId }).sort({ createdAt: -1 }).lean<GiftCardDoc[]>().exec();
    }
    return mockCards.filter((c) => c.purchasedBy === customerId);
  },

  async listByRecipientEmail(email: string): Promise<GiftCardDoc[]> {
    const lower = email.toLowerCase();
    if (hasMongoConnection) {
      return GiftCardModel.find({ recipientEmail: lower }).sort({ createdAt: -1 }).lean<GiftCardDoc[]>().exec();
    }
    return mockCards.filter((c) => c.recipientEmail?.toLowerCase() === lower);
  },

  async list(): Promise<GiftCardDoc[]> {
    if (hasMongoConnection) {
      return GiftCardModel.find({}).sort({ createdAt: -1 }).lean<GiftCardDoc[]>().exec();
    }
    return [...mockCards];
  },

  async create(input: {
    initialAmount: number;
    purchasedBy?: string;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    orderId?: string;
    expiresAt?: string;
  }): Promise<GiftCardDoc> {
    const now = new Date().toISOString();
    // Default expiry: 2 years
    const expiresAt = input.expiresAt ?? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const card: GiftCardDoc = {
      id: createId("gc"),
      code: generateCode(),
      initialAmount: input.initialAmount,
      balance: input.initialAmount,
      purchasedBy: input.purchasedBy,
      recipientEmail: input.recipientEmail?.toLowerCase(),
      recipientName: input.recipientName,
      message: input.message,
      orderId: input.orderId,
      isActive: true,
      expiresAt,
      createdAt: now,
      updatedAt: now
    };
    if (hasMongoConnection) {
      const doc = await GiftCardModel.create(card);
      return doc.toObject() as GiftCardDoc;
    }
    mockCards.push(card);
    return card;
  },

  /** Atomically deduct `amount` from balance. Returns false if balance insufficient or card invalid. */
  async deductBalance(code: string, amount: number): Promise<boolean> {
    const upper = code.toUpperCase().replace(/-/g, "").trim();
    if (hasMongoConnection) {
      const now = new Date().toISOString();
      const result = await GiftCardModel.updateOne(
        { code: upper, isActive: true, balance: { $gte: amount } },
        { $inc: { balance: -amount }, $set: { updatedAt: now } }
      );
      return result.modifiedCount > 0;
    }
    const card = mockCards.find((c) => c.code === upper);
    if (!card || !card.isActive || card.balance < amount) return false;
    card.balance -= amount;
    card.updatedAt = new Date().toISOString();
    return true;
  },

  /** Restore balance when an order is cancelled. */
  async restoreBalance(code: string, amount: number): Promise<void> {
    const upper = code.toUpperCase().replace(/-/g, "").trim();
    if (hasMongoConnection) {
      const now = new Date().toISOString();
      await GiftCardModel.updateOne(
        { code: upper },
        { $inc: { balance: amount }, $set: { updatedAt: now } }
      );
      return;
    }
    const card = mockCards.find((c) => c.code === upper);
    if (card) {
      card.balance = Math.min(card.initialAmount, card.balance + amount);
      card.updatedAt = new Date().toISOString();
    }
  },

  async update(id: string, updates: Partial<Pick<GiftCardDoc, "isActive" | "expiresAt" | "balance">>): Promise<GiftCardDoc | null> {
    const now = new Date().toISOString();
    if (hasMongoConnection) {
      return GiftCardModel.findOneAndUpdate({ id }, { ...updates, updatedAt: now }, { new: true }).lean<GiftCardDoc>().exec();
    }
    const card = mockCards.find((c) => c.id === id);
    if (!card) return null;
    Object.assign(card, updates, { updatedAt: now });
    return card;
  },

  /** Delta adjustment with floor-at-zero.
   *  The write is atomic (aggregation pipeline $max). The `previousBalance` in the
   *  return value is a best-effort snapshot — it may be stale under concurrent writes,
   *  but the final balance stored in MongoDB is always correct. */
  async adjustBalance(id: string, delta: number): Promise<{ previousBalance: number; newBalance: number; card: GiftCardDoc | null }> {
    const now = new Date().toISOString();
    if (hasMongoConnection) {
      const before = await GiftCardModel.findOne({ id }).lean<GiftCardDoc>().exec();
      if (!before) return { previousBalance: 0, newBalance: 0, card: null };
      const updated = await GiftCardModel.findOneAndUpdate(
        { id },
        [{ $set: { balance: { $max: [0, { $add: ["$balance", delta] }] }, updatedAt: now } }],
        { new: true }
      ).lean<GiftCardDoc>().exec();
      return { previousBalance: before.balance, newBalance: updated?.balance ?? 0, card: updated };
    }
    const card = mockCards.find((c) => c.id === id);
    if (!card) return { previousBalance: 0, newBalance: 0, card: null };
    const prev = card.balance;
    card.balance = Math.max(0, card.balance + delta);
    card.updatedAt = now;
    return { previousBalance: prev, newBalance: card.balance, card };
  }
};
