import { Schema, model, models } from "mongoose";

export type ReferralDoc = {
  _id: string;
  userId: string;
  code: string;
  usedBy: string[];
  createdAt: string;
};

const referralSchema = new Schema<ReferralDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    usedBy: { type: [String], default: [] },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const ReferralModel = models.Referral ?? model<ReferralDoc>("Referral", referralSchema);
