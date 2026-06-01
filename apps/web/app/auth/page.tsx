"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "../../components/auth-panel";

function AuthPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/";
  const isCheckout = redirectTo !== "/";

  return (
    <div className="auth-page-root">
      {/* ── Left brand panel ── */}
      <div className="auth-brand-panel">
        {/* animated gradient orbs */}
        <div className="auth-orb auth-orb-1" aria-hidden="true" />
        <div className="auth-orb auth-orb-2" aria-hidden="true" />
        <div className="auth-orb auth-orb-3" aria-hidden="true" />

        <div className="auth-brand-top">
          <div className="auth-brand-logo-mark" aria-hidden="true">A</div>

          <h1 className="auth-brand-display">
            Wear<br />
            <em>Your</em><br />
            Story
          </h1>

          <p className="auth-brand-sub">
            Premium streetwear drops for those who move different.
            Limited runs. Uncompromising quality.
          </p>

          <div className="auth-brand-pills">
            <span className="auth-brand-pill">Free shipping ₹1,500+</span>
            <span className="auth-brand-pill">Secure payments</span>
            <span className="auth-brand-pill">Easy returns</span>
          </div>
        </div>

        <p className="auth-brand-bottom">© ASUR 2025 · New Delhi, India</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <h2 className="auth-form-heading">
            {isCheckout ? "Sign in to continue" : "Welcome back"}
          </h2>
          <p className="auth-form-sub">
            {isCheckout
              ? "Sign in to complete your purchase."
              : "Sign in or create your ASUR account."}
          </p>
          <AuthPanel redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-root">
          <div className="auth-brand-panel">
            <div className="auth-orb auth-orb-1" aria-hidden="true" />
            <div className="auth-orb auth-orb-2" aria-hidden="true" />
            <div className="auth-brand-top">
              <div className="auth-brand-logo-mark">A</div>
              <div className="skeleton skeleton-line" style={{ height: 80, width: "80%", borderRadius: 8 }} />
            </div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-form-inner" style={{ display: "grid", gap: "1rem" }}>
              <div className="skeleton skeleton-line" style={{ height: 36, width: "50%" }} />
              <div className="skeleton skeleton-line" style={{ height: 50 }} />
              <div className="skeleton skeleton-line" style={{ height: 50 }} />
              <div className="skeleton skeleton-line" style={{ height: 50 }} />
            </div>
          </div>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}
