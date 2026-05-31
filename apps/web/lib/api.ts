import { createApiClient } from "@asur/api-client";
import { firebaseAuth } from "./firebase";

// Always fetch from Firebase SDK so expired tokens are refreshed automatically.
// Falls back to null (unauthenticated) when no Firebase session exists.
async function getAuthToken(): Promise<string | null> {
  const user = firebaseAuth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  getAuthToken
});
