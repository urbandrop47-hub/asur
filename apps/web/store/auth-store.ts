"use client";

import { create } from "zustand";
import type { AuthSession } from "@asur/types";
import { clearStoredSession, readStoredSession, saveStoredSession } from "../lib/auth-storage";

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: readStoredSession(),
  setSession: (session) => {
    if (session) {
      saveStoredSession(session);
    } else {
      clearStoredSession();
    }

    set({ session });
  },
  clearSession: () => {
    clearStoredSession();
    set({ session: null });
  }
}));
