"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut
} from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import type { AuthSession } from "@asur/types";
import { api } from "../lib/api";
import { firebaseAuth, hasFirebaseConfig } from "../lib/firebase";
import { useAuthStore } from "../store/auth-store";


type PendingLink =
  | { provider: "google"; credential: ReturnType<typeof GoogleAuthProvider.credential>; email?: string }
  | { provider: "password"; credential: ReturnType<typeof EmailAuthProvider.credential>; email?: string };

type AuthPanelProps = { redirectTo?: string };

// ─── Google logo SVG ────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export function AuthPanel({ redirectTo = "/" }: AuthPanelProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [authTab, setAuthTab] = useState<"email" | "phone">("email");
  const [providers, setProviders] = useState<string[]>([]);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  // Ref mirrors state so the onAuthStateChanged callback always sees the latest
  // value without needing to re-register the listener on every setPendingLink call.
  const pendingLinkRef = useRef<PendingLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  // ── Phone OTP state ─────────────────────────��──────────────────
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  async function syncSessionFromFirebaseUser() {
    if (!firebaseAuth?.currentUser) return;
    const user = firebaseAuth.currentUser;
    try {
      // Read from ref — the state closure captured at effect-registration time
      // may be stale when onAuthStateChanged fires after setPendingLink was called.
      const link = pendingLinkRef.current;
      if (link) {
        // Clear the ref BEFORE attempting — if linkWithCredential throws, a
        // subsequent onAuthStateChanged won't retry with the same stale credential.
        pendingLinkRef.current = null;
        setPendingLink(null);
        await linkWithCredential(user, link.credential);
      }
      setProviders(user.providerData.map((p) => p.providerId));
      const idToken = await user.getIdToken(true);
      const response = await api.post<{ data: AuthSession }>("/api/v1/auth/session", { idToken });
      setSession(response.data);
      if (redirectTo !== "/") {
        router.push(redirectTo);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Session sync failed");
    }
  }

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) { setProviders([]); clearSession(); return; }
      setProviders(user.providerData.map((p) => p.providerId));
      await syncSessionFromFirebaseUser();
    });
  }, [clearSession, setSession]);

  // Admin/SUPER_ADMIN users can use the storefront normally.
  // The admin dashboard is accessible directly at its own URL.

  async function handleGoogleSignIn() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add values to apps/web/.env.local.");
      return;
    }
    setBusy(true); setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth, provider);
    } catch (error) {
      const authError = error as { code?: string; customData?: { email?: string } };
      if (authError.code === "auth/account-exists-with-different-credential") {
        const emailForAccount = authError.customData?.email?.trim() ?? email.trim();
        const pendingCredential = GoogleAuthProvider.credentialFromError(
          error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
        );
        if (pendingCredential) {
          const pl: PendingLink = { provider: "google", credential: pendingCredential, email: emailForAccount || undefined };
          pendingLinkRef.current = pl;
          setPendingLink(pl);
          if (emailForAccount) {
            setEmail(emailForAccount);
            try {
              await fetchSignInMethodsForEmail(firebaseAuth, emailForAccount);
              setMessage("This email is already linked to another method. Sign in with that method and we'll attach Google automatically.");
            } catch { setMessage("Sign in with your existing method to link Google."); }
          }
          return;
        }
      }
      setMessage(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLinkGoogle() {
    if (!firebaseAuth || !hasFirebaseConfig() || !firebaseAuth.currentUser) return;
    setBusy(true); setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await linkWithPopup(firebaseAuth.currentUser, provider);
      await syncSessionFromFirebaseUser();
      setMessage("Google linked to your account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google linking failed");
    } finally { setBusy(false); }
  }

  async function handleEmailAuth() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing."); return;
    }
    if (!email.trim() || !password) { setMessage("Enter your email and password."); return; }
    setBusy(true); setMessage(null);
    try {
      if (mode === "create-account") {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }
    } catch (error) {
      const authError = error as { code?: string };
      if (mode === "create-account" && authError.code === "auth/email-already-in-use") {
        try {
          const methods = await fetchSignInMethodsForEmail(firebaseAuth, email.trim());
          if (methods.includes("google.com")) {
            const pl: PendingLink = { provider: "password", credential: EmailAuthProvider.credential(email.trim(), password), email: email.trim() };
            pendingLinkRef.current = pl;
            setPendingLink(pl);
            setMessage("An account exists for this email. Sign in with Google and we'll link your password automatically.");
            return;
          }
        } catch { /* fall through */ }
        setMessage("An account already exists for this email. Try signing in instead.");
        return;
      }
      if (mode === "sign-in" && authError.code === "auth/wrong-password") {
        setMessage("Incorrect password. Try Google sign-in if you registered with Google.");
        return;
      }
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally { setBusy(false); }
  }

  async function handlePasswordReset() {
    if (!firebaseAuth || !hasFirebaseConfig()) return;
    if (!email.trim()) { setMessage("Enter your email to reset the password."); return; }
    setBusy(true); setMessage(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setMessage(`Reset link sent to ${email.trim()}. Check your inbox.`);
      setShowForgot(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed");
    } finally { setBusy(false); }
  }

  async function handleSendOtp() {
    if (!firebaseAuth || !hasFirebaseConfig()) { setMessage("Firebase config is missing."); return; }
    const phone = phoneNumber.trim().startsWith("+") ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;
    if (!/^\+\d{10,15}$/.test(phone.replace(/[\s\-]/g, ""))) {
      setMessage("Enter a valid phone number."); return;
    }
    setBusy(true); setMessage(null);
    try {
      // Create (or reuse) the invisible reCAPTCHA verifier
      if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaContainerRef.current, { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifierRef.current!);
      setConfirmationResult(result);
      setPhoneStep("otp");
      setMessage("OTP sent! Check your messages.");
    } catch (error) {
      // Reset verifier on error so it can be recreated fresh
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      setMessage(error instanceof Error ? error.message : "Failed to send OTP");
    } finally { setBusy(false); }
  }

  async function handleVerifyOtp() {
    if (!confirmationResult) return;
    if (!otp.trim() || otp.length < 4) { setMessage("Enter the OTP you received."); return; }
    setBusy(true); setMessage(null);
    try {
      await confirmationResult.confirm(otp.trim());
      // onAuthStateChanged fires → syncSessionFromFirebaseUser handles the rest
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid OTP — please try again");
    } finally { setBusy(false); }
  }

  async function handleSignOut() {
    if (firebaseAuth) await signOut(firebaseAuth);
    clearSession();
    setMessage(null);
  }

  const firebaseReady = hasFirebaseConfig();

  // ── Signed-in view ─────────────────────────────────────────────
  if (session?.user) {
    return (
      <div>
        <div className="auth-signed-in">
          <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.95rem" }}>
            {session.user.name ?? session.user.email ?? "Authenticated"}
          </p>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.83rem", color: "var(--text-muted)" }}>
            {session.user.email ?? session.user.firebaseUid} · <span style={{ color: "var(--success)" }}>{session.user.role}</span>
          </p>
          <button className="auth-ghost-link" onClick={handleSignOut}>Sign out</button>
          {session?.user && !providers.includes("google.com") && (
            <button
              className="auth-ghost-link"
              style={{ marginLeft: "1rem" }}
              onClick={handleLinkGoogle}
              disabled={busy}
            >
              Link Google
            </button>
          )}
        </div>
        {message && <div className="auth-message">{message}</div>}
        {pendingLink && (
          <div className="auth-message" style={{ color: "var(--accent)" }}>
            Linking {pendingLink.provider === "google" ? "Google" : "email/password"} — finish signing in to merge.
          </div>
        )}
      </div>
    );
  }

  // ── Forgot-password mini-form ──────────────────────────────────
  if (showForgot) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: "0 0 0.25rem", fontWeight: 700 }}>Reset password</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            We&apos;ll send a reset link to your email.
          </p>
        </div>
        <div className="form-field">
          <label className="form-label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button className="auth-submit-btn" onClick={handlePasswordReset} disabled={busy || !firebaseReady}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <button className="auth-ghost-link" onClick={() => setShowForgot(false)}>
          ← Back to sign in
        </button>
        {message && <div className="auth-message">{message}</div>}
      </div>
    );
  }

  // ── Main auth form ─────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gap: "0" }}>
      {!firebaseReady && (
        <div className="error-banner" style={{ marginBottom: "1.25rem" }}>
          Firebase config missing — add values to <code style={{ fontSize: "0.8em" }}>apps/web/.env.local</code>.
        </div>
      )}

      {/* Google SSO */}
      <button className="auth-google-btn" onClick={handleGoogleSignIn} disabled={busy || !firebaseReady}>
        <GoogleIcon />
        {busy ? "Signing in…" : "Continue with Google"}
      </button>

      <div className="auth-divider">or</div>

      {/* Auth method tabs: Email | Phone */}
      <div className="auth-mode-tabs" style={{ marginBottom: "1rem" }}>
        <button
          className={`auth-mode-tab${authTab === "email" ? " active" : ""}`}
          onClick={() => { setAuthTab("email"); setMessage(null); setPhoneStep("input"); }}
        >
          Email
        </button>
        <button
          className={`auth-mode-tab${authTab === "phone" ? " active" : ""}`}
          onClick={() => { setAuthTab("phone"); setMessage(null); }}
        >
          Phone (OTP)
        </button>
      </div>

      {/* ── Phone OTP flow ── */}
      {authTab === "phone" && (
        <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1rem" }}>
          {/* invisible reCAPTCHA anchor */}
          <div ref={recaptchaContainerRef} />

          {phoneStep === "input" ? (
            <>
              <div className="form-field">
                <label className="form-label">Mobile number</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ padding: "0 0.85rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", display: "flex", alignItems: "center", fontSize: "0.92rem", flexShrink: 0 }}>
                    +91
                  </span>
                  <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setMessage(null); }}
                    placeholder="98765 43210"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <button
                className="auth-submit-btn"
                onClick={handleSendOtp}
                disabled={busy || !firebaseReady || phoneNumber.replace(/\D/g, "").length < 10}
              >
                {busy ? "Sending OTP…" : "Send OTP →"}
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Enter the 6-digit code sent to +91 {phoneNumber}
              </p>
              <div className="form-field">
                <label className="form-label">One-time password</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setMessage(null); }}
                  placeholder="123456"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  style={{ letterSpacing: "0.2em", fontFamily: "monospace", fontSize: "1.1rem" }}
                />
              </div>
              <button
                className="auth-submit-btn"
                onClick={handleVerifyOtp}
                disabled={busy || otp.length < 6}
              >
                {busy ? "Verifying…" : "Verify & sign in →"}
              </button>
              <button
                className="auth-ghost-link"
                onClick={() => { setPhoneStep("input"); setOtp(""); setMessage(null); setConfirmationResult(null); }}
              >
                ← Change number
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Email / password flow ── */}
      {authTab === "email" && (
        <>
          {/* Mode tabs */}
          <div className="auth-mode-tabs">
            <button
              className={`auth-mode-tab${mode === "sign-in" ? " active" : ""}`}
              onClick={() => { setMode("sign-in"); setMessage(null); }}
            >
              Sign in
            </button>
            <button
              className={`auth-mode-tab${mode === "create-account" ? " active" : ""}`}
              onClick={() => { setMode("create-account"); setMessage(null); }}
            >
              Create account
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1rem" }}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
              />
            </div>
            <div className="form-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span className="form-label" style={{ margin: 0 }}>Password</span>
                {mode === "sign-in" && (
                  <button className="auth-ghost-link" style={{ fontSize: "0.78rem" }} onClick={() => { setShowForgot(true); setMessage(null); }}>
                    Forgot?
                  </button>
                )}
              </div>
              <input
                className="input"
                type="password"
                autoComplete={mode === "create-account" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
              />
            </div>
          </div>

          <button
            className="auth-submit-btn"
            onClick={handleEmailAuth}
            disabled={busy || !firebaseReady}
          >
            {busy
              ? "Working…"
              : mode === "create-account"
                ? "Create account →"
                : "Sign in →"}
          </button>
        </>
      )}

      {message && <div className="auth-message">{message}</div>}
      {pendingLink && (
        <div className="auth-message" style={{ borderColor: "rgba(249,115,22,0.25)", color: "var(--accent)" }}>
          Linking {pendingLink.provider === "google" ? "Google" : "email/password"} — finish signing in with the existing account to merge automatically.
        </div>
      )}
    </div>
  );
}
