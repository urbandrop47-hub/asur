import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { resolveUserFromIdToken } from "../services/auth.service";

const VENDOR_ROLES = new Set(["VENDOR", "ADMIN", "SUPER_ADMIN"]);

/**
 * Verifies the Bearer token and ensures the caller is VENDOR, ADMIN, or SUPER_ADMIN.
 * Sets res.locals.user on success.
 */
export const requireVendor: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const user = await resolveUserFromIdToken(token);

  if (!VENDOR_ROLES.has(user.role)) {
    res.status(403).json({ success: false, message: "Vendor access required" });
    return;
  }

  res.locals.user = user;
  next();
});
