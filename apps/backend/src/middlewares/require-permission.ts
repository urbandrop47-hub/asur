import type { RequestHandler } from "express";
import type { AdminPermission } from "@asur/types";
import { canUseAdminPermission } from "../shared/admin-access";

/**
 * Returns a middleware that gates the route on a specific admin permission.
 * Must be placed AFTER adminOnlyMiddleware (which verifies the token).
 *
 * The admin's effective role is read from the ADMIN_ROLE env var (default SUPER_ADMIN).
 * To lock down a deployment to ADMIN-level access, set ADMIN_ROLE=ADMIN.
 */
export function requirePermission(permission: AdminPermission): RequestHandler {
  const role = (process.env.ADMIN_ROLE ?? "SUPER_ADMIN").trim();
  return (_req, res, next) => {
    if (!canUseAdminPermission(role, permission)) {
      res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
      return;
    }
    next();
  };
}
