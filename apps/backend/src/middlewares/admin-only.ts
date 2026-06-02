import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env";

/**
 * Admin gate — verifies that the request carries the static ADMIN_SECRET
 * as a Bearer token.  No Firebase, no database lookup, no role checks.
 *
 * Set ADMIN_SECRET to any strong random string in your .env / Railway vars.
 * The admin login screen in apps/admin sends whatever the user types as the
 * Authorization: Bearer header.
 */
export const adminOnlyMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Admin token required" });
    return;
  }

  const secret = env.ADMIN_SECRET;
  if (!secret) {
    // Misconfiguration — refuse all access rather than accidentally letting
    // an empty string match an empty token.
    res.status(503).json({ success: false, message: "Admin auth not configured (ADMIN_SECRET missing)" });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  let valid = false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid admin token" });
    return;
  }

  next();
};
