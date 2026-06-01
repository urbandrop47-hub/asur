import type { AuthSession } from "@asur/types";

const AUTH_SESSION_KEY = "asur.auth.session";

function readRawSession() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_SESSION_KEY);
}

export function readStoredSession(): AuthSession | null {
  const raw = readRawSession();
  if (!raw) {
    return null;
  }

  let session: AuthSession;
  try {
    session = JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }

  // Evict sessions whose accessToken has already expired (Firebase tokens live ~1 hour).
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    clearStoredSession();
    return null;
  }

  return session;
}

export function readStoredAuthToken(): string | null {
  return readStoredSession()?.accessToken ?? null;
}

export function saveStoredSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}
