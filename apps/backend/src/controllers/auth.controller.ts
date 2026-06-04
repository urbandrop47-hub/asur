import { z } from "zod";
import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createSession, resolveUserFromIdToken } from "../services/auth.service";
import { authSessionSchema } from "../validators/auth.validators";
import { addressSchema } from "../shared/validations";
import { userRepository } from "../repositories/user.repository";
import { OrderModel } from "../models/order.model";
import { ReviewModel } from "../models/review.model";
import { WishlistModel } from "../models/wishlist.model";
import { hasMongoConnection } from "../config/env";
import { env } from "../config/env";
import { mockStore } from "../repositories/mock-store";

const UNSUB_SECRET = env.JWT_SECRET || "asur-unsub-fallback-secret";

function makeUnsubToken(userId: string): string {
  const hmac = crypto.createHmac("sha256", UNSUB_SECRET).update(userId).digest("base64url");
  return `${Buffer.from(userId).toString("base64url")}.${hmac}`;
}

function verifyUnsubToken(token: string): string | null {
  try {
    const [uidB64, hmac] = token.split(".");
    if (!uidB64 || !hmac) return null;
    const userId = Buffer.from(uidB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", UNSUB_SECRET).update(userId).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))) return null;
    return userId;
  } catch {
    return null;
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[\d\s\-]{8,15}$/).optional()
}).refine((d) => d.name !== undefined || d.phoneNumber !== undefined, {
  message: "At least one of name or phoneNumber is required"
});

/**
 * @swagger
 * /api/v1/auth/session:
 *   post:
 *     summary: Exchange a Firebase ID token for a backend session
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token obtained from the frontend SDK
 *     responses:
 *       200:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessionId: { type: string }
 *                         accessToken: { type: string }
 *                         expiresAt: { type: string }
 *                         user:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             email: { type: string }
 *                             role: { type: string }
 */
export const createSessionController: RequestHandler = asyncHandler(async (req, res) => {
  const { idToken } = authSessionSchema.parse(req.body);
  const session = await createSession(idToken);
  sendSuccess(res, session, "Session created");
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *       401:
 *         description: Missing or invalid token
 */
export const meController: RequestHandler = asyncHandler(async (_req, res) => {
  // requireSession has already resolved and attached the user
  sendSuccess(res, res.locals.user, "Authenticated user fetched");
});

/**
 * @swagger
 * /api/v1/auth/addresses:
 *   get:
 *     summary: List saved shipping addresses for the current user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of saved addresses
 *       401:
 *         description: Not authenticated
 */
export const listAddressesController: RequestHandler = asyncHandler(async (_req, res) => {
  const user = res.locals.user;
  const profile = await userRepository.findByFirebaseUid(user.firebaseUid);
  sendSuccess(res, profile?.addresses ?? [], "Addresses fetched");
});

/**
 * @swagger
 * /api/v1/auth/addresses:
 *   post:
 *     summary: Save a new shipping address to the current user's profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Updated array of addresses
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
export const saveAddressController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const address = addressSchema.parse(req.body);

  const profile = await userRepository.findByFirebaseUid(user.firebaseUid);
  if ((profile?.addresses?.length ?? 0) >= 10) {
    res.status(400).json({ success: false, message: "You can save up to 10 addresses. Remove one before adding another." });
    return;
  }

  const updated = await userRepository.saveAddress(user.firebaseUid, address);
  sendSuccess(res, updated, "Address saved");
});

export const updateProfileController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const patch = updateProfileSchema.parse(req.body);
  const updated = await userRepository.updateProfile(user.firebaseUid, patch);
  if (!updated) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  sendSuccess(res, { name: updated.name, phoneNumber: updated.phoneNumber }, "Profile updated");
});

export const deleteAddressController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const index = parseInt(String(req.params.index), 10);
  if (isNaN(index) || index < 0) {
    res.status(400).json({ success: false, message: "Invalid address index" });
    return;
  }
  const updated = await userRepository.removeAddress(user.firebaseUid, index);
  if (updated === null) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  sendSuccess(res, updated, "Address removed");
});

// PATCH /api/v1/auth/email-preferences
export const updateEmailPrefsController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const schema = z.object({ marketing: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "marketing (boolean) is required" });
    return;
  }
  const updated = await userRepository.updateEmailPrefs(user.firebaseUid, parsed.data);
  if (!updated) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  sendSuccess(res, { marketing: updated.emailPrefs?.marketing ?? true }, "Email preferences updated");
});

// GET /api/v1/auth/email-preferences
export const getEmailPrefsController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const profile = await userRepository.findByFirebaseUid(user.firebaseUid);
  sendSuccess(res, { marketing: profile?.emailPrefs?.marketing ?? true }, "Email preferences fetched");
});

// GET /api/v1/unsubscribe?token=<token> — public, no auth required
export const unsubscribeController: RequestHandler = asyncHandler(async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).send("<html><body><h2>Invalid unsubscribe link.</h2></body></html>");
    return;
  }
  const userId = verifyUnsubToken(token);
  if (!userId) {
    res.status(400).send("<html><body><h2>This unsubscribe link is invalid or has expired.</h2></body></html>");
    return;
  }
  await userRepository.updateEmailPrefsByUserId(userId, { marketing: false });
  // Redirect to web confirmation page
  const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  res.redirect(`${webUrl}/unsubscribed`);
});

// GET /api/v1/auth/data-export — GDPR data portability
export const dataExportController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  const profile = await userRepository.findByFirebaseUid(user.firebaseUid);

  let orders: unknown[] = [];
  let reviews: unknown[] = [];
  let wishlist: unknown[] = [];

  if (hasMongoConnection) {
    [orders, reviews, wishlist] = await Promise.all([
      OrderModel.find({ customerId: user.id }).lean(),
      ReviewModel.find({ customerId: user.id }).lean(),
      WishlistModel.find({ userId: user.id }).lean()
    ]);
  } else {
    orders = mockStore.orders.filter((o) => o.customerId === user.id);
    reviews = (mockStore as Record<string, unknown[]>).reviews?.filter((r: unknown) => (r as { customerId: string }).customerId === user.id) ?? [];
  }

  const exportData = {
    profile: {
      id: profile?.id,
      email: profile?.email,
      name: profile?.name,
      phoneNumber: profile?.phoneNumber,
      role: profile?.role,
      addresses: profile?.addresses,
      emailPrefs: profile?.emailPrefs,
      createdAt: profile?.createdAt
    },
    orders,
    reviews,
    wishlist,
    exportedAt: new Date().toISOString()
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="asur-data-export-${new Date().toISOString().slice(0, 10)}.json"`);
  res.status(200).send(JSON.stringify(exportData, null, 2));
});

// DELETE /api/v1/auth/account — GDPR right to erasure (anonymises PII, keeps order records)
export const deleteAccountController: RequestHandler = asyncHandler(async (req, res) => {
  const user = res.locals.user;
  await userRepository.anonymize(user.firebaseUid);
  sendSuccess(res, null, "Account data anonymised. Your order records are retained for legal/accounting purposes per our Privacy Policy.");
});
