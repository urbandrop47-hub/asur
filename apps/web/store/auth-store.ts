"use client";

import { create } from "zustand";
import type { AuthSession } from "@asur/types";
import { clearStoredSession, readStoredSession, saveStoredSession } from "../lib/auth-storage";
import { useCartStore } from "./cart-store";

type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  // Start null on both server and client to prevent SSR/hydration mismatch.
  // The `hydrate` action reads localStorage after mount.
  session: null,
  hydrated: false,
  hydrate: () => {
    set({ session: readStoredSession(), hydrated: true });
  },
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
    useCartStore.getState().clear();
    set({ session: null });
  }
}));
