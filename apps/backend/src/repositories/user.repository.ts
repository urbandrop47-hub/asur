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
  async findById(id: string) {
    if (hasMongoConnection) {
      return UserModel.findOne({ id }).lean<UserProfile>().exec();
    }
    return mockStore.users.find((user) => user.id === id) ?? null;
  },

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

  /** Add an address, enforcing `maxAddresses` atomically.
   *  Returns the updated address array, or null if the limit was already reached. */
  async saveAddress(firebaseUid: string, address: Address, maxAddresses = 10) {
    if (hasMongoConnection) {
      // Atomic: only push when current array length is below the limit.
      const user = await UserModel.findOneAndUpdate(
        { firebaseUid, $expr: { $lt: [{ $size: { $ifNull: ["$addresses", []] } }, maxAddresses] } },
        { $push: { addresses: address }, $set: { updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean<UserProfile>().exec();
      if (!user) return null; // either user not found or limit already reached
      return user.addresses;
    }

    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (!existing) return null;
    if ((existing.addresses?.length ?? 0) >= maxAddresses) return null;
    existing.addresses = [...(existing.addresses ?? []), address];
    existing.updatedAt = new Date().toISOString();
    return existing.addresses;
  },

  async updateProfile(firebaseUid: string, patch: { name?: string; phoneNumber?: string }) {
    if (hasMongoConnection) {
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (patch.name !== undefined) update.name = patch.name;
      if (patch.phoneNumber !== undefined) update.phoneNumber = patch.phoneNumber;
      const user = await UserModel.findOneAndUpdate(
        { firebaseUid },
        { $set: update },
        { new: true }
      ).lean<UserProfile>().exec();
      return user;
    }

    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (!existing) return null;
    if (patch.name !== undefined) existing.name = patch.name;
    if (patch.phoneNumber !== undefined) existing.phoneNumber = patch.phoneNumber;
    existing.updatedAt = new Date().toISOString();
    return existing;
  },

  async removeAddress(firebaseUid: string, index: number) {
    if (hasMongoConnection) {
      const user = await UserModel.findOne({ firebaseUid }).exec();
      if (!user) return null;
      const addresses = user.addresses ?? [];
      if (index < 0 || index >= addresses.length) return addresses;
      addresses.splice(index, 1);
      user.addresses = addresses;
      user.updatedAt = new Date().toISOString();
      await user.save();
      return user.addresses;
    }

    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (!existing) return null;
    const addresses = existing.addresses ?? [];
    if (index < 0 || index >= addresses.length) return addresses;
    existing.addresses = addresses.filter((_, i) => i !== index);
    existing.updatedAt = new Date().toISOString();
    return existing.addresses;
  },

  async updateEmailPrefs(firebaseUid: string, prefs: { marketing: boolean }) {
    if (hasMongoConnection) {
      const user = await UserModel.findOneAndUpdate(
        { firebaseUid },
        { $set: { "emailPrefs.marketing": prefs.marketing, updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean<UserProfile>().exec();
      return user;
    }
    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (!existing) return null;
    if (!existing.emailPrefs) existing.emailPrefs = { marketing: true };
    existing.emailPrefs.marketing = prefs.marketing;
    existing.updatedAt = new Date().toISOString();
    return existing;
  },

  async updateEmailPrefsByUserId(userId: string, prefs: { marketing: boolean }) {
    if (hasMongoConnection) {
      const user = await UserModel.findOneAndUpdate(
        { id: userId },
        { $set: { "emailPrefs.marketing": prefs.marketing, updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean<UserProfile>().exec();
      return user;
    }
    const existing = mockStore.users.find((u) => u.id === userId);
    if (!existing) return null;
    if (!existing.emailPrefs) existing.emailPrefs = { marketing: true };
    existing.emailPrefs.marketing = prefs.marketing;
    existing.updatedAt = new Date().toISOString();
    return existing;
  },

  /** Anonymise a user's PII for GDPR "right to erasure". Order records are retained for accounting. */
  async anonymize(firebaseUid: string) {
    if (hasMongoConnection) {
      await UserModel.updateOne(
        { firebaseUid },
        {
          $set: {
            name: "Deleted User",
            email: null,
            phoneNumber: null,
            avatarUrl: null,
            addresses: [],
            "emailPrefs.marketing": false,
            updatedAt: new Date().toISOString()
          }
        }
      );
      return true;
    }
    const existing = mockStore.users.find((u) => u.firebaseUid === firebaseUid);
    if (!existing) return false;
    existing.name = "Deleted User";
    existing.email = undefined;
    existing.phoneNumber = undefined;
    existing.avatarUrl = undefined;
    existing.addresses = [];
    if (existing.emailPrefs) existing.emailPrefs.marketing = false;
    existing.updatedAt = new Date().toISOString();
    return true;
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
