/**
 * Super-admin bootstrap is no longer used.
 * Admin access is now granted via the static ADMIN_SECRET env var —
 * no MongoDB user or Firebase role is required to enter the admin panel.
 *
 * This file is kept to avoid breaking any imports; it exports a no-op.
 */
export async function bootstrapSuperAdmin(): Promise<null> {
  return null;
}
