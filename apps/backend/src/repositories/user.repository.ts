import type { Address, UserProfile, UserRole } from "@asur/types";
import { hasMongoConnection } from "../config/env";
import { UserModel } from "../models/user.model";
import { mockStore } from "./mock-store";
import { createId } from "../lib/id";

export type UpsertUserInput = {
  firebaseUid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

export type UpdateUserRoleInput = {
  firebaseUid: string;
  role: UserRole;
};

function applyRole(profile: UserProfile, role: UserRole): UserProfile {
  return {
    ...profile,
    role,
    updatedAt: new Date().toISOString()
  };
}

export const userRepository = {
  async findByFirebaseUid(firebaseUid: string) {
    if (hasMongoConnection) {
      return UserModel.findOne({ firebaseUid }).lean<UserProfile>().exec();
    }

    return mockStore.users.find((user) => user.firebaseUid === firebaseUid) ?? null;
  },

  async findByEmail(email: string) {
    if (hasMongoConnection) {
      return UserModel.findOne({ email }).lean<UserProfile>().exec();
    }

    return mockStore.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
  },

  async upsertFromAuth(input: UpsertUserInput) {
    if (hasMongoConnection) {
      const now = new Date().toISOString();
      const existing = await UserModel.findOne({ firebaseUid: input.firebaseUid }).exec();

      if (existing) {
        existing.phoneNumber = input.phoneNumber ?? existing.phoneNumber;
        existing.email = input.email ?? existing.email;
        existing.name = input.name ?? existing.name;
        existing.avatarUrl = input.avatarUrl ?? existing.avatarUrl;
        existing.updatedAt = now;
        await existing.save();
        return existing.toObject();
      }

      const created = await UserModel.create({
        id: createId("usr"),
        firebaseUid: input.firebaseUid,
        phoneNumber: input.phoneNumber,
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: "CUSTOMER",
        addresses: [],
        createdAt: now,
        updatedAt: now
      });

      return created.toObject();
    }

    const existing = mockStore.users.find((user) => user.firebaseUid === input.firebaseUid);
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        phoneNumber: input.phoneNumber ?? existing.phoneNumber,
        email: input.email ?? existing.email,
        name: input.name ?? existing.name,
        avatarUrl: input.avatarUrl ?? existing.avatarUrl,
        updatedAt: new Date().toISOString()
      };
      Object.assign(existing, updated);
      return existing;
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: createId("usr"),
      firebaseUid: input.firebaseUid,
      phoneNumber: input.phoneNumber,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      role: "CUSTOMER",
      addresses: [],
      createdAt: now,
      updatedAt: now
    };
    mockStore.users.push(profile);
    return profile;
  },

  async saveAddress(firebaseUid: string, address: Address) {
    if (hasMongoConnection) {
      const user = await UserModel.findOneAndUpdate(
        { firebaseUid },
        { $push: { addresses: address }, $set: { updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean<UserProfile>().exec();
      return user?.addresses ?? [];
    }

    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (existing) {
      existing.addresses = [...(existing.addresses ?? []), address];
      existing.updatedAt = new Date().toISOString();
      return existing.addresses;
    }
    return [];
  },

  async setRole(input: UpdateUserRoleInput) {
    if (hasMongoConnection) {
      const user = await UserModel.findOne({ firebaseUid: input.firebaseUid }).exec();
      if (!user) {
        return null;
      }

      user.role = input.role;
      user.updatedAt = new Date().toISOString();
      await user.save();
      return user.toObject();
    }

    const existing = mockStore.users.find((user) => user.firebaseUid === input.firebaseUid);
    if (!existing) {
      return null;
    }

    const updated = applyRole(existing, input.role);
    Object.assign(existing, updated);
    return existing;
  }
};
