"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import type { AuthSession } from "@asur/types";
import { Button, Pill } from "@asur/ui";
import { api } from "../lib/api";
import { firebaseAuth, hasFirebaseConfig } from "../lib/firebase";
import { useAuthStore } from "../store/auth-store";
import { APP_NAME } from "@asur/constants";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

type PendingLink =
  | {
      provider: "google";
      credential: ReturnType<typeof GoogleAuthProvider.credential>;
      email?: string;
    }
  | {
      provider: "password";
      credential: ReturnType<typeof EmailAuthProvider.credential>;
      email?: string;
    };

type AuthPanelProps = {
  /** Where to send the user after a successful customer sign-in. Defaults to "/". */
  redirectTo?: string;
};

export function AuthPanel({ redirectTo = "/" }: AuthPanelProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [providers, setProviders] = useState<string[]>([]);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncSessionFromFirebaseUser() {
    if (!firebaseAuth?.currentUser) {
      return;
    }

    const user = firebaseAuth.currentUser;

    try {
      if (pendingLink) {
        await linkWithCredential(user, pendingLink.credential);
        setPendingLink(null);
      }

      setProviders(user.providerData.map((provider) => provider.providerId));
      const idToken = await user.getIdToken(true);
      const response = await api.post<{ data: AuthSession }>("/api/v1/auth/session", { idToken });
      setSession(response.data);
      setMessage(`Signed in as ${response.data.user.email ?? response.data.user.name ?? "user"}`);

      // Redirect non-admin users to the requested destination
      const role = response.data.user.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN" && redirectTo !== "/") {
        router.push(redirectTo);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Session sync failed");
    }
  }

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setProviders([]);
        clearSession();
        return;
      }

      setProviders(user.providerData.map((provider) => provider.providerId));
      await syncSessionFromFirebaseUser();
    });
  }, [clearSession, setSession]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
      window.location.assign(adminUrl);
    }
  }, [session?.user]);

  async function handleGoogleSignIn() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add the web config values to apps/web/.env.local.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth, provider);
      setMessage(`Signed into ${APP_NAME}.`);
    } catch (error) {
      const authError = error as {
        code?: string;
        customData?: { email?: string };
      };

      if (authError.code === "auth/account-exists-with-different-credential") {
        const emailForAccount = authError.customData?.email?.trim() ?? email.trim();
        const pendingCredential = GoogleAuthProvider.credentialFromError(error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);

        if (pendingCredential) {
          setPendingLink({
            provider: "google",
            credential: pendingCredential,
            email: emailForAccount || undefined
          });

          if (emailForAccount) {
            setEmail(emailForAccount);
            const methods = await fetchSignInMethodsForEmail(firebaseAuth, emailForAccount);
            setMessage(
              methods.length
                ? `This email is already linked to ${methods.join(", ")}. Sign in with the existing method and we’ll attach Google automatically.`
                : "This email already exists. Sign in with the matching method and we’ll link Google automatically."
            );
          } else {
            setMessage("Google is already attached to another account. Sign in with the matching method and we’ll link it automatically.");
          }
          return;
        }
      }

      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLinkGoogle() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add the web config values to apps/web/.env.local.");
      return;
    }

    if (!firebaseAuth.currentUser) {
      setMessage("Sign in first, then link Google to the current account.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await linkWithPopup(firebaseAuth.currentUser, provider);
      await syncSessionFromFirebaseUser();
      setMessage("Google is now linked to this Firebase account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google linking failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailAuth() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add the web config values to apps/web/.env.local.");
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Enter both email and password.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      if (mode === "create-account") {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        setMessage(`Account created for ${email.trim()}.`);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        setMessage(`Signed in with ${email.trim()}.`);
      }
    } catch (error) {
      const authError = error as {
        code?: string;
        customData?: { email?: string };
      };

      if (mode === "create-account" && authError.code === "auth/email-already-in-use") {
        const emailForAccount = email.trim();
        const methods = await fetchSignInMethodsForEmail(firebaseAuth, emailForAccount);

        if (methods.includes("google.com")) {
          setPendingLink({
            provider: "password",
            credential: EmailAuthProvider.credential(emailForAccount, password),
            email: emailForAccount
          });
          setMessage("This email already has Google linked. Sign in with Google and we’ll attach your email/password automatically.");
          return;
        }

        setMessage(`This email already exists and uses: ${methods.join(", ") || "unknown method"}.`);
        return;
      }

      if (mode === "sign-in" && authError.code === "auth/wrong-password") {
        setMessage("Wrong password. If this account started with Google, sign in with Google and link email/password from the panel.");
        return;
      }

      setMessage(error instanceof Error ? error.message : "Email authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLinkEmailPassword() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add the web config values to apps/web/.env.local.");
      return;
    }

    if (!firebaseAuth.currentUser) {
      setMessage("Sign in first, then link email/password to the current account.");
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Enter both email and password before linking.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const credential = EmailAuthProvider.credential(email.trim(), password);
      await linkWithCredential(firebaseAuth.currentUser, credential);
      await syncSessionFromFirebaseUser();
      setMessage(`Email/password linked to ${firebaseAuth.currentUser.email ?? email.trim()}.`);
    } catch (error) {
      const authError = error as {
        code?: string;
        customData?: { email?: string };
      };

      if (authError.code === "auth/credential-already-in-use" || authError.code === "auth/email-already-in-use") {
        const methods = await fetchSignInMethodsForEmail(firebaseAuth, email.trim());
        if (methods.includes("google.com")) {
          setPendingLink({
            provider: "password",
            credential: EmailAuthProvider.credential(email.trim(), password),
            email: email.trim()
          });
          setMessage("This email is already tied to Google. Sign in with Google and we’ll finish linking automatically.");
          return;
        }
      }

      setMessage(error instanceof Error ? error.message : "Email/password linking failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (!firebaseAuth || !hasFirebaseConfig()) {
      setMessage("Firebase config is missing. Add the web config values to apps/web/.env.local.");
      return;
    }

    if (!email.trim()) {
      setMessage("Enter your email to reset the password.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setMessage(`Password reset email sent to ${email.trim()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
    clearSession();
    setMessage("Signed out.");
  }

  return (
    <div className="card-surface panel stack">
      <div className="section-title" style={{ margin: 0 }}>
        <div>
          <h2 style={{ margin: 0 }}>Sign in</h2>
          <p>Firebase handles identity, then the backend turns that into a Mongo-backed session.</p>
        </div>
      </div>

      <div className="actions" style={{ alignItems: "center" }}>
        {session?.user ? (
          <Pill tone={session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN" ? "success" : "info"}>
            {session.user.role}
          </Pill>
        ) : (
          <Pill tone="warning">Signed out</Pill>
        )}
        <Pill tone="info">{hasFirebaseConfig() ? "Firebase ready" : "Firebase config missing"}</Pill>
      </div>

      {session?.user ? (
        <div className="stack">
          <strong>{session.user.name ?? session.user.email ?? "Authenticated user"}</strong>
          <p className="muted" style={{ margin: 0 }}>
            {session.user.email ?? session.user.firebaseUid}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Backend role: {session.user.role}
          </p>
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          Use Google or email/password to create or restore your backend session.
        </p>
      )}

      <div className="stack">
        <div className="stack" style={{ gap: "0.75rem" }}>
          <label className="stack" style={{ gap: "0.35rem" }}>
            <span className="muted">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            <span className="muted">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={mode === "create-account" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>

        <div className="actions">
          <Button onClick={handleEmailAuth} disabled={busy || !hasFirebaseConfig()}>
            {busy ? "Working..." : mode === "create-account" ? "Create email account" : "Continue with email"}
          </Button>
          <Button variant="ghost" onClick={() => setMode((current) => (current === "sign-in" ? "create-account" : "sign-in"))}>
            {mode === "sign-in" ? "New account?" : "Already have one?"}
          </Button>
          <Button variant="ghost" onClick={handlePasswordReset} disabled={busy || !hasFirebaseConfig()}>
            Reset password
          </Button>
        </div>

        <div className="actions">
          <Button onClick={handleGoogleSignIn} disabled={busy || !hasFirebaseConfig()}>
            {busy ? "Signing in..." : "Continue with Google"}
          </Button>
          <Button variant="ghost" onClick={handleLinkGoogle} disabled={busy || !hasFirebaseConfig() || !session?.user}>
            Link Google
          </Button>
          <Button variant="ghost" onClick={handleLinkEmailPassword} disabled={busy || !hasFirebaseConfig() || !session?.user}>
            Link email/password
          </Button>
          {session?.user ? (
            <Button variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : null}
        </div>
      </div>

      {providers.length ? (
        <div className="actions" style={{ alignItems: "center" }}>
          <Pill tone="info">Linked providers</Pill>
          {providers.map((provider) => (
            <Pill key={provider} tone={provider === "google.com" ? "success" : "warning"}>
              {provider === "google.com" ? "Google" : provider === "password" ? "Email/password" : provider}
            </Pill>
          ))}
        </div>
      ) : null}

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
      {pendingLink ? (
        <p className="muted" style={{ margin: 0 }}>
          Pending link: {pendingLink.provider === "google" ? "Google" : "email/password"}
          {pendingLink.email ? ` for ${pendingLink.email}` : ""}. Finish signing in with the matching account and we’ll merge it.
        </p>
      ) : null}
      <p className="muted" style={{ margin: 0 }}>
        Phone sign-in can be added later and linked to the same Firebase user when you enable that provider.
      </p>
    </div>
  );
}
