import { Schema, model, models } from "mongoose";

export type LoyaltyTier = "Bronze" | "Silver" | "Gold";

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 2000
};

export function computeTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS.Gold) return "Gold";
  if (lifetimePoints >= TIER_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

export type LoyaltyAccountDoc = {
  _id: string;
  userId: string;
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  updatedAt: string;
};

const loyaltyAccountSchema = new Schema<LoyaltyAccountDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    points: { type: Number, required: true, default: 0, min: 0 },
    lifetimePoints: { type: Number, required: true, default: 0, min: 0 },
    tier: { type: String, required: true, default: "Bronze", enum: ["Bronze", "Silver", "Gold"] },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const LoyaltyAccountModel =
  models.LoyaltyAccount ?? model<LoyaltyAccountDoc>("LoyaltyAccount", loyaltyAccountSchema);

// ── Transactions ──────────────────────────────────────────────────────────────

export type LoyaltyTxType = "earn" | "redeem" | "restore" | "expire" | "referral_bonus";

export type LoyaltyTransactionDoc = {
  _id: string;
  userId: string;
  type: LoyaltyTxType;
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
};

const loyaltyTransactionSchema = new Schema<LoyaltyTransactionDoc>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["earn", "redeem", "restore", "expire", "referral_bonus"] },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    orderId: { type: String },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });

export const LoyaltyTransactionModel =
  models.LoyaltyTransaction ??
  model<LoyaltyTransactionDoc>("LoyaltyTransaction", loyaltyTransactionSchema);
