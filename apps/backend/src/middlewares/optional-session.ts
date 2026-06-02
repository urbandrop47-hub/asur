import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { resolveUserFromIdToken } from "../services/auth.service";

/**
 * Middleware that tries to resolve a Bearer token but never blocks the request.
 * If auth succeeds, `res.locals.user` is populated; otherwise it stays undefined.
 */
export const optionalSession: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (token) {
    try {
      const user = await resolveUserFromIdToken(token);
      res.locals.user = user;
    } catch {
      // ignore — request proceeds as unauthenticated
    }
  }
  next();
});
