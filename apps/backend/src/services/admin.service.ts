import type { AdminAccessModel, AdminInvite } from "@asur/types";
import { adminRepository, type AcceptAdminInviteInput, type CreateAdminInviteInput } from "../repositories/admin.repository";

export function getAdminAccessModel(): AdminAccessModel {
  return adminRepository.getAccessModel();
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  return adminRepository.listInvites();
}

export async function createAdminInvite(input: CreateAdminInviteInput) {
  return adminRepository.createInvite(input);
}

export async function acceptAdminInvite(input: AcceptAdminInviteInput) {
  return adminRepository.acceptInvite(input);
}
