import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { userRepository } from "../repositories/user.repository";

/**
 * Middleware that verifies the Bearer token and attaches the resolved user
 * to `res.locals.user`. Returns 401 if the token is missing or invalid.
 * Uses a read-only DB lookup (not upsert) to avoid a write on every request.
 */
export const requireSession: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const identity = await verifyFirebaseIdToken(token);
    const user = await userRepository.findByFirebaseUid(identity.firebaseUid);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found — please sign in again" });
      return;
    }
    res.locals.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
});
