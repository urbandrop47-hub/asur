import type { UserProfile } from "@asur/types";
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

function touchProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
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
  }
};
