import {
  LoyaltyAccountModel,
  LoyaltyTransactionModel,
  computeTier,
  type LoyaltyAccountDoc,
  type LoyaltyTransactionDoc,
  type LoyaltyTxType
} from "../models/loyalty.model";

// 1pt earned per ₹10 spent; 10pts redeemed = ₹1 off
export const EARN_RATE = 10;   // ₹ per point earned
export const REDEEM_RATE = 10; // points per ₹1 discount
export const MIN_REDEEM = 50;  // minimum points to redeem
export const MAX_REDEEM_PCT = 0.2; // max 20% of order subtotal

export const loyaltyRepository = {
  async getOrCreate(userId: string): Promise<LoyaltyAccountDoc> {
    const existing = await LoyaltyAccountModel.findOne({ userId }).lean();
    if (existing) return existing as unknown as LoyaltyAccountDoc;

    const now = new Date().toISOString();
    const doc = await LoyaltyAccountModel.create({
      userId,
      points: 0,
      lifetimePoints: 0,
      tier: "Bronze",
      updatedAt: now
    });
    return doc.toObject();
  },

  async getAccount(userId: string): Promise<LoyaltyAccountDoc | null> {
    const doc = await LoyaltyAccountModel.findOne({ userId }).lean();
    return doc ? (doc as unknown as LoyaltyAccountDoc) : null;
  },

  async getTransactions(userId: string, limit = 30): Promise<LoyaltyTransactionDoc[]> {
    const docs = await LoyaltyTransactionModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as LoyaltyTransactionDoc[];
  },

  async earnPoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string,
    type: LoyaltyTxType = "earn"
  ): Promise<LoyaltyAccountDoc> {
    const now = new Date().toISOString();
    const updated = await LoyaltyAccountModel.findOneAndUpdate(
      { userId },
      {
        $inc: { points, lifetimePoints: points },
        $set: { updatedAt: now }
      },
      { new: true, upsert: true }
    ).lean();

    const account = updated as unknown as LoyaltyAccountDoc;
    const newTier = computeTier(account.lifetimePoints);
    if (account.tier !== newTier) {
      await LoyaltyAccountModel.updateOne({ userId }, { $set: { tier: newTier } });
      account.tier = newTier;
    }

    await LoyaltyTransactionModel.create({ userId, type, points, description, orderId, createdAt: now });
    return account;
  },

  async redeemPoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string
  ): Promise<{ success: boolean; account: LoyaltyAccountDoc | null }> {
    const now = new Date().toISOString();
    const updated = await LoyaltyAccountModel.findOneAndUpdate(
      { userId, points: { $gte: points } },
      { $inc: { points: -points }, $set: { updatedAt: now } },
      { new: true }
    ).lean();

    if (!updated) return { success: false, account: null };

    await LoyaltyTransactionModel.create({
      userId,
      type: "redeem",
      points: -points,
      description,
      orderId,
      createdAt: now
    });

    return { success: true, account: updated as unknown as LoyaltyAccountDoc };
  },

  async restorePoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await LoyaltyAccountModel.findOneAndUpdate(
      { userId },
      { $inc: { points }, $set: { updatedAt: now } },
      { upsert: true }
    );
    await LoyaltyTransactionModel.create({
      userId,
      type: "restore",
      points,
      description,
      orderId,
      createdAt: now
    });
  }
};
