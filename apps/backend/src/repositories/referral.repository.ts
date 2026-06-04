import { randomBytes } from "node:crypto";
import { ReferralModel, type ReferralDoc } from "../models/referral.model";

function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export const referralRepository = {
  async getOrCreate(userId: string): Promise<ReferralDoc> {
    const existing = await ReferralModel.findOne({ userId }).lean();
    if (existing) return existing as unknown as ReferralDoc;

    // Generate a unique 6-char code; retry on collision (extremely rare)
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      try {
        const doc = await ReferralModel.create({
          userId,
          code,
          usedBy: [],
          createdAt: new Date().toISOString()
        });
        return doc.toObject();
      } catch (err: unknown) {
        // duplicate key — retry with a new code
        const isDuplicate = (err as { code?: number })?.code === 11000;
        if (!isDuplicate) throw err;
      }
    }
    throw new Error("Failed to generate a unique referral code");
  },

  async findByCode(code: string): Promise<ReferralDoc | null> {
    const doc = await ReferralModel.findOne({ code: code.toUpperCase() }).lean();
    return doc ? (doc as unknown as ReferralDoc) : null;
  },

  async hasUsed(code: string, userId: string): Promise<boolean> {
    const count = await ReferralModel.countDocuments({ code, usedBy: userId });
    return count > 0;
  },

  async markUsed(code: string, userId: string): Promise<boolean> {
    const result = await ReferralModel.updateOne(
      { code, usedBy: { $ne: userId } },
      { $addToSet: { usedBy: userId } }
    );
    return result.modifiedCount > 0;
  },

  async getByUserId(userId: string): Promise<ReferralDoc | null> {
    const doc = await ReferralModel.findOne({ userId }).lean();
    return doc ? (doc as unknown as ReferralDoc) : null;
  }
};
