import type { RequestHandler } from "express";
import { env, shouldBootstrapSuperAdmin } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { isAdminRole } from "../shared/admin-access";
import { asyncHandler } from "../lib/async-handler";
import { resolveUserFromIdToken } from "../services/auth.service";

export const adminOnlyMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Missing admin session token"
    });
    return;
  }

  // Bootstrap: if enabled and the raw token matches the configured UID/email,
  // promote and admit — regardless of whether Firebase creds are configured.
  // This lets the first SUPER_ADMIN claim their account after Firebase is wired up.
  if (shouldBootstrapSuperAdmin) {
    const bootstrapUid = env.SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID.trim();
    const bootstrapEmail = env.SUPER_ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
    const isBootstrapToken =
      (bootstrapUid.length > 0 && token === bootstrapUid) ||
      (bootstrapEmail.length > 0 && token.toLowerCase() === bootstrapEmail);

    if (isBootstrapToken) {
      let user = bootstrapUid.length > 0 ? await userRepository.findByFirebaseUid(bootstrapUid) : null;

      if (!user && bootstrapEmail.length > 0) {
        user = await userRepository.findByEmail(bootstrapEmail);
      }

      if (!user && bootstrapUid.length > 0) {
        user = await userRepository.upsertFromAuth({
          firebaseUid: bootstrapUid,
          email: bootstrapEmail || undefined,
          name: env.SUPER_ADMIN_BOOTSTRAP_NAME.trim() || undefined,
          phoneNumber: env.SUPER_ADMIN_BOOTSTRAP_PHONE.trim() || undefined,
          avatarUrl: env.SUPER_ADMIN_BOOTSTRAP_AVATAR_URL.trim() || undefined
        });
      }

      const resolvedUser = user;
      if (!resolvedUser) {
        res.status(500).json({
          success: false,
          message: "Failed to resolve bootstrap admin user"
        });
        return;
      }

      if (resolvedUser.role !== "SUPER_ADMIN") {
        const promoted = await userRepository.setRole({
          firebaseUid: resolvedUser.firebaseUid,
          role: "SUPER_ADMIN"
        });

        if (promoted) {
          user = promoted;
        }
      }

      const finalUser = user;
      if (finalUser && isAdminRole(finalUser.role)) {
        res.locals.adminUser = finalUser;
        next();
        return;
      }
    }
  }

  let user: Awaited<ReturnType<typeof resolveUserFromIdToken>>;
  try {
    user = await resolveUserFromIdToken(token);
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired admin token" });
    return;
  }

  if (!isAdminRole(user.role)) {
    res.status(403).json({
      success: false,
      message: "Admin access required"
    });
    return;
  }

  res.locals.adminUser = user;
  next();
});
