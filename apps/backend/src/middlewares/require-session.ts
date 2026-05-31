import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { resolveUserFromIdToken } from "../services/auth.service";

/**
 * Middleware that verifies the Bearer token and attaches the resolved user
 * to `res.locals.user`. Returns 401 if the token is missing or invalid.
 */
export const requireSession: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const user = await resolveUserFromIdToken(token);
    res.locals.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
});
