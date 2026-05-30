import type { RequestHandler } from "express";
import { z } from "zod";
import { adminRoles } from "@asur/constants";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { acceptAdminInvite, createAdminInvite, getAdminAccessModel, listAdminInvites } from "../services/admin.service";

const createAdminInviteRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(adminRoles),
  createdBy: z.string().min(1).optional(),
  notes: z.string().optional()
});

const acceptAdminInviteRequestSchema = z.object({
  token: z.string().min(16),
  idToken: z.string().min(10)
});

export const getAdminAccessController: RequestHandler = asyncHandler(async (_req, res) => {
  sendSuccess(res, getAdminAccessModel(), "Admin access model fetched");
});

export const listAdminInvitesController: RequestHandler = asyncHandler(async (_req, res) => {
  const invites = await listAdminInvites();
  sendSuccess(res, invites, "Admin invites fetched");
});

export const createAdminInviteController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = createAdminInviteRequestSchema.parse(req.body);
  const invite = await createAdminInvite({
    ...payload,
    createdBy: res.locals.adminUser?.id ?? payload.createdBy
  });
  sendSuccess(res, invite, "Admin invite created", 201);
});

export const acceptAdminInviteController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = acceptAdminInviteRequestSchema.parse(req.body);
  const identity = await verifyFirebaseIdToken(payload.idToken);
  const result = await acceptAdminInvite({
    token: payload.token,
    firebaseUid: identity.firebaseUid,
    phoneNumber: identity.phoneNumber,
    email: identity.email,
    name: identity.name,
    avatarUrl: identity.avatarUrl
  });

  if (!result) {
    res.status(404).json({
      success: false,
      message: "Invite not found or already used"
    });
    return;
  }

  sendSuccess(res, result, "Admin invite accepted");
});
