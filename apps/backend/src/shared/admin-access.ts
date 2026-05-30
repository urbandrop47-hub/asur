import { adminPermissions, adminRolePermissions, adminRoles } from "@asur/constants";
import type { AdminAccessModel, AdminPermission, AdminRole } from "@asur/types";

export const adminAccessModel: AdminAccessModel = {
  roles: [...adminRoles],
  permissions: [...adminPermissions],
  invitePolicy: {
    mode: "invite-only",
    issuerRoles: ["SUPER_ADMIN"]
  },
  rules: [
    {
      role: "ADMIN",
      permissions: [...adminRolePermissions.ADMIN]
    },
    {
      role: "SUPER_ADMIN",
      permissions: [...adminRolePermissions.SUPER_ADMIN]
    }
  ]
};

export function isAdminRole(role: string | undefined): role is AdminRole {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canUseAdminPermission(role: string | undefined, permission: AdminPermission) {
  if (!isAdminRole(role)) {
    return false;
  }

  return adminAccessModel.rules.some((rule) => rule.role === role && rule.permissions.includes(permission));
}
