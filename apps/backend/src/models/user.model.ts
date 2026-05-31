import { Schema, model, models } from "mongoose";
import type { UserProfile } from "@asur/types";

const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    label: { type: String },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new Schema<UserProfile>(
  {
    id: { type: String, required: true, index: true },
    firebaseUid: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String },
    email: { type: String },
    name: { type: String },
    avatarUrl: { type: String },
    role: { type: String, required: true, default: "CUSTOMER" },
    addresses: { type: [addressSchema], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const UserModel = models.User ?? model<UserProfile>("User", userSchema);
