"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "../../components/auth-panel";

function AuthPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/";

  return (
    <div className="stack" style={{ maxWidth: 520, margin: "2rem auto 0" }}>
      <div className="section-title" style={{ marginTop: "1rem" }}>
        <div>
          <h1>Sign in</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {redirectTo !== "/" ? "Sign in to continue to checkout." : "Welcome back to ASUR."}
          </p>
        </div>
      </div>

      <AuthPanel redirectTo={redirectTo} />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div style={{ paddingTop: "3rem", display: "grid", gap: "1rem", maxWidth: 520, margin: "0 auto" }}>
          <div className="skeleton skeleton-line" style={{ height: 36, width: "40%" }} />
          <div className="skeleton skeleton-line" style={{ height: 300, borderRadius: 20 }} />
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}
