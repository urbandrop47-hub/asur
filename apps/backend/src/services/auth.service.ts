import { randomUUID } from "node:crypto";
import type { AuthSession } from "@asur/types";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { userRepository } from "../repositories/user.repository";

export async function createSession(idToken: string): Promise<AuthSession> {
  const user = await resolveUserFromIdToken(idToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString();

  return {
    sessionId: randomUUID(),
    provider: "firebase",
    accessToken: idToken,
    expiresAt,
    user
  };
}

export async function resolveUserFromIdToken(idToken: string) {
  const identity = await verifyFirebaseIdToken(idToken);
  return userRepository.upsertFromAuth(identity);
}
