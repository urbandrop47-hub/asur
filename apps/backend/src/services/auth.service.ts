import { randomUUID } from "node:crypto";
import type { AuthSession } from "@asur/types";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { userRepository } from "../repositories/user.repository";

export async function createSession(idToken: string): Promise<AuthSession> {
  const identity = await verifyFirebaseIdToken(idToken);
  const user = await userRepository.upsertFromAuth(identity);
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
