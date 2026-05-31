import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { userRepository } from "../repositories/user.repository";

const VENDOR_ROLES = new Set(["VENDOR", "ADMIN", "SUPER_ADMIN"]);

/**
 * Verifies the Bearer token and ensures the caller is VENDOR, ADMIN, or SUPER_ADMIN.
 * Does NOT upsert new users — an unregistered UID gets 403, not a CUSTOMER record.
 * Sets res.locals.user on success.
 */
export const requireVendor: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  let firebaseUid: string;
  try {
    const identity = await verifyFirebaseIdToken(token);
    firebaseUid = identity.firebaseUid;
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session token" });
    return;
  }

  const user = await userRepository.findByFirebaseUid(firebaseUid);
  if (!user || !VENDOR_ROLES.has(user.role)) {
    res.status(403).json({ success: false, message: "Vendor access required" });
    return;
  }

  res.locals.user = user;
  next();
});
