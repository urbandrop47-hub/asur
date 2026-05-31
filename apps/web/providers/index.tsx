"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/auth-store";

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthHydrator />
      {children}
    </>
  );
}
