import { adminRolePermissions, adminRoles } from "@asur/constants";

export const adminAccessChecklist = [
  "Invite-only onboarding",
  "Role-gated product editing",
  "Publish and pricing boundaries",
  "Inventory and fulfillment permissions",
  "Super admin override for sensitive operations"
];

export const adminAccessSummary = adminRoles.map((role) => ({
  role,
  permissions: adminRolePermissions[role]
}));
