import { env, shouldBootstrapSuperAdmin } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { isAdminRole } from "../shared/admin-access";

export async function bootstrapSuperAdmin() {
  if (!shouldBootstrapSuperAdmin) {
    return null;
  }

  const firebaseUid = env.SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID.trim();
  const email = env.SUPER_ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
  const name = env.SUPER_ADMIN_BOOTSTRAP_NAME.trim() || undefined;
  const phoneNumber = env.SUPER_ADMIN_BOOTSTRAP_PHONE.trim() || undefined;
  const avatarUrl = env.SUPER_ADMIN_BOOTSTRAP_AVATAR_URL.trim() || undefined;

  if (!firebaseUid && !email) {
    throw new Error("SUPER_ADMIN bootstrap requires at least SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID or SUPER_ADMIN_BOOTSTRAP_EMAIL");
  }

  let user = firebaseUid ? await userRepository.findByFirebaseUid(firebaseUid) : null;

  if (!user && email) {
    user = await userRepository.findByEmail(email);
  }

  if (!user) {
    if (!firebaseUid) {
      throw new Error(
        "No existing user matched the bootstrap email. Create the user in Mongo first or provide SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID."
      );
    }

    user = await userRepository.upsertFromAuth({
      firebaseUid,
      email: email || undefined,
      name,
      phoneNumber,
      avatarUrl
    });
  } else if (firebaseUid && user.firebaseUid !== firebaseUid) {
    user = await userRepository.upsertFromAuth({
      firebaseUid,
      email: email || user.email,
      name: name ?? user.name,
      phoneNumber: phoneNumber ?? user.phoneNumber,
      avatarUrl: avatarUrl ?? user.avatarUrl
    });
  }

  const resolvedUser = user;
  if (!resolvedUser) {
    throw new Error("Bootstrap user could not be resolved");
  }

  if (!isAdminRole(resolvedUser.role) || resolvedUser.role !== "SUPER_ADMIN") {
    const updated = await userRepository.setRole({
      firebaseUid: resolvedUser.firebaseUid,
      role: "SUPER_ADMIN"
    });

    if (!updated) {
      throw new Error("Failed to promote bootstrap user to SUPER_ADMIN");
    }

    user = updated;
  }

  return user;
}
