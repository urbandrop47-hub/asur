import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createSession, resolveUserFromIdToken } from "../services/auth.service";
import { authSessionSchema } from "../validators/auth.validators";
import { addressSchema } from "../shared/validations";
import { userRepository } from "../repositories/user.repository";

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
