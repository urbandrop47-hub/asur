import { Schema, model, models } from "mongoose";
import type { AdminInvite } from "@asur/types";

const adminInviteSchema = new Schema<AdminInvite>(
  {
    id: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ["ADMIN", "SUPER_ADMIN"] },
    status: { type: String, required: true, enum: ["pending", "accepted", "revoked", "expired"] },
    token: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String },
    acceptedBy: { type: String },
    notes: { type: String },
    expiresAt: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    acceptedAt: { type: String }
  },
  { versionKey: false }
);

export const AdminInviteModel = models.AdminInvite ?? model<AdminInvite>("AdminInvite", adminInviteSchema);
