import { randomUUID } from "node:crypto";
import type { AuthSession } from "@asur/types";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { userRepository } from "../repositories/user.repository";

export async function createSession(idToken: string): Promise<AuthSession> {
  const user = await resolveUserFromIdToken(idToken);
  const now = new Date();
  // Firebase ID tokens expire after 1 hour. Store that as the session expiry so
  // the client can detect staleness and re-authenticate rather than silently failing.
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 55).toISOString(); // 55 min (5-min buffer)

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
