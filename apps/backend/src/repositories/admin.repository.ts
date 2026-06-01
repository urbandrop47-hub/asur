import { randomUUID } from "node:crypto";
import type { AdminAccessModel, AdminInvite, AdminRole } from "@asur/types";
import { adminAccessModel } from "../shared/admin-access";
import { hasMongoConnection } from "../config/env";
import { AdminInviteModel } from "../models/admin-invite.model";
import { mockStore } from "./mock-store";
import { createId } from "../lib/id";
import { userRepository } from "./user.repository";

export type CreateAdminInviteInput = {
  email: string;
  role: AdminRole;
  createdBy?: string;
  notes?: string;
};

export type AcceptAdminInviteInput = {
  token: string;
  firebaseUid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

function createInviteToken() {
  return randomUUID().replace(/-/g, "");
}

function toExpiryDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function storeInvite(invite: AdminInvite) {
  if (hasMongoConnection) {
    return AdminInviteModel.create(invite);
  }

  mockStore.adminInvites.push(invite);
  return invite;
}

export const adminRepository = {
  getAccessModel(): AdminAccessModel {
    return adminAccessModel;
  },

  async listInvites() {
    if (hasMongoConnection) {
      return AdminInviteModel.find().sort({ createdAt: -1 }).lean<AdminInvite[]>().exec();
    }

    return [...mockStore.adminInvites].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createInvite(input: CreateAdminInviteInput) {
    const normalizedEmail = input.email.toLowerCase();

    // Reject if a pending invite already exists for this email — prevents orphaned tokens.
    const existing = hasMongoConnection
      ? await AdminInviteModel.findOne({ email: normalizedEmail, status: "pending" }).lean<AdminInvite>().exec()
      : mockStore.adminInvites.find((i) => i.email === normalizedEmail && i.status === "pending") ?? null;

    if (existing) {
      throw new Error(`A pending invite already exists for ${normalizedEmail}. Revoke it before creating a new one.`);
    }

    const now = new Date().toISOString();
    const invite: AdminInvite = {
      id: createId("ainv"),
      email: input.email.toLowerCase(),
      role: input.role,
      status: "pending",
      token: createInviteToken(),
      createdBy: input.createdBy,
      notes: input.notes,
      expiresAt: toExpiryDate(),
      createdAt: now,
      updatedAt: now
    };

    await storeInvite(invite);
    return invite;
  },

  async acceptInvite(input: AcceptAdminInviteInput) {
    const invite = hasMongoConnection
      ? await AdminInviteModel.findOne({ token: input.token }).lean<AdminInvite>().exec()
      : mockStore.adminInvites.find((item) => item.token === input.token) ?? null;

    if (!invite || invite.status !== "pending" || new Date(invite.expiresAt).getTime() < Date.now()) {
      return null;
    }

    // The accepting identity must have the same email as the invite.
    // Phone-only Firebase accounts have no email — reject them outright rather
    // than silently bypassing the check (which the old `input.email &&` guard did).
    if (!input.email || input.email.toLowerCase() !== invite.email.toLowerCase()) {
      return null;
    }

    const user = await userRepository.upsertFromAuth({
      firebaseUid: input.firebaseUid,
      phoneNumber: input.phoneNumber,
      email: input.email ?? invite.email,
      name: input.name,
      avatarUrl: input.avatarUrl
    });

    const now = new Date().toISOString();
    const acceptedInvite: AdminInvite = {
      ...invite,
      status: "accepted",
      acceptedBy: user.id,
      acceptedAt: now,
      updatedAt: now
    };

    // Mark accepted BEFORE setRole so that a concurrent retry on the same token
    // hits status !== "pending" and is rejected rather than re-granting the role
    // to a different firebaseUid.
    if (hasMongoConnection) {
      const result = await AdminInviteModel.updateOne(
        { token: input.token, status: "pending" },
        {
          $set: {
            status: acceptedInvite.status,
            acceptedBy: acceptedInvite.acceptedBy,
            acceptedAt: acceptedInvite.acceptedAt,
            updatedAt: acceptedInvite.updatedAt
          }
        }
      ).exec();
      if (result.modifiedCount === 0) {
        // Another concurrent request already claimed this invite
        return null;
      }
    } else {
      const index = mockStore.adminInvites.findIndex((item) => item.token === input.token && item.status === "pending");
      if (index < 0) return null;
      mockStore.adminInvites[index] = acceptedInvite;
    }

    const updatedUser = await userRepository.setRole({
      firebaseUid: input.firebaseUid,
      role: invite.role
    });

    return {
      invite: acceptedInvite,
      user: updatedUser ?? user
    };
  }
};
