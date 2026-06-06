"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { firebaseAuth } from "../../../lib/firebase";
import { useAuthStore } from "../../../store/auth-store";
import { api } from "../../../lib/api";

const inputStyle: React.CSSProperties = {
  display: "none"
};

function Toggle({
  checked,
  onChange,
  disabled,
  id
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 48, height: 26, borderRadius: 999, border: "none",
        background: checked ? "#f97316" : "rgba(255,255,255,0.12)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        flexShrink: 0, opacity: disabled ? 0.5 : 1
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s"
      }} />
    </button>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  id
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ minWidth: 0 }}>
        <label htmlFor={id} style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem", cursor: disabled ? "default" : "pointer" }}>
          {label}
        </label>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{description}</p>
      </div>
      {onChange ? (
        <Toggle checked={checked} onChange={onChange} disabled={disabled} id={id} />
      ) : (
        <span style={{ fontSize: "0.75rem", color: "var(--success, #22c55e)", fontWeight: 600, flexShrink: 0 }}>Always on</span>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { session, hydrated, clearSession } = useAuthStore();

  const [marketing, setMarketing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // GDPR actions
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { router.replace("/auth?next=/account/notifications"); return; }

    api
      .get<{ data: { marketing: boolean } }>("/api/v1/auth/email-preferences")
      .then((r) => setMarketing(r.data.marketing))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, hydrated, router]);

  async function saveMarketing(value: boolean) {
    setMarketing(value);
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.patch("/api/v1/auth/email-preferences", { marketing: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDataExport() {
    setExporting(true);
    try {
      // Always fetch a fresh Firebase token — the stored accessToken may be expired
      // (Firebase tokens live ~1 hour and are not auto-refreshed in localStorage).
      const freshToken = await firebaseAuth?.currentUser?.getIdToken() ?? session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const resp = await fetch(`${baseUrl}/api/v1/auth/data-export`, {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asur-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Data export failed. Please try again or email privacy@asur.in");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.del("/api/v1/auth/account");
      // Clear the local session so the user is not shown as still logged in
      clearSession();
      router.push("/?account_deleted=1");
    } catch {
      setError("Account deletion failed. Please email privacy@asur.in");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!hydrated || !session) return null;

  const card: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "1.25rem"
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem 5rem", display: "grid", gap: "1.5rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
        <Link href="/account" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Account</Link>
        <span>›</span>
        <span style={{ color: "var(--text)" }}>Notifications & Privacy</span>
      </div>

      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Notifications & Privacy</h1>

      {/* Email preferences */}
      <div style={card}>
        <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Email notifications
        </p>

        {loading ? (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
            <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
          </div>
        ) : (
          <>
            <PreferenceRow
              id="email-transactional"
              label="Order updates"
              description="Confirmations, shipping notifications, return status, and account security alerts. Cannot be disabled."
              checked={true}
              disabled
            />
            <PreferenceRow
              id="email-marketing"
              label="Marketing emails"
              description="New drops, promotions, restocks, and brand news. You can opt out at any time."
              checked={marketing}
              onChange={saveMarketing}
              disabled={saving}
            />
          </>
        )}

        {saved && (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", color: "var(--success, #22c55e)", fontWeight: 600 }}>
            ✓ Preferences saved
          </p>
        )}
        {error && (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", color: "var(--danger)" }}>{error}</p>
        )}
      </div>

      {/* GDPR */}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Your data (GDPR / DPDP Act)
        </p>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ padding: "0.85rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.88rem" }}>Download my data</p>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Download a full copy of your personal data — profile, orders, reviews, wishlist — as a JSON file.
            </p>
            <button
              onClick={handleDataExport}
              disabled={exporting}
              style={{
                padding: "0.55rem 1.1rem", borderRadius: 999, fontWeight: 600, fontSize: "0.83rem",
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
                color: "var(--text)", cursor: exporting ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: "0.4rem"
              }}
            >
              {exporting ? "Preparing…" : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download my data
                </>
              )}
            </button>
          </div>

          <div style={{ padding: "0.85rem", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
            <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.88rem", color: "#ef4444" }}>Delete my account</p>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Permanently removes your personal information (name, email, phone, addresses). Order records are retained for legal/accounting purposes as required by Indian GST law.
            </p>
            {confirmDelete && (
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", color: "#ef4444", fontWeight: 600 }}>
                Are you sure? This action cannot be undone.
              </p>
            )}
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{
                padding: "0.55rem 1.1rem", borderRadius: 999, fontWeight: 600, fontSize: "0.83rem",
                border: "1px solid rgba(239,68,68,0.4)", background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
                color: "#ef4444", cursor: deleting ? "wait" : "pointer"
              }}
            >
              {deleting ? "Deleting…" : confirmDelete ? "Yes, delete my account" : "Delete my account"}
            </button>
            {confirmDelete && !deleting && (
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  marginLeft: "0.5rem", padding: "0.55rem 1rem", borderRadius: 999, fontWeight: 500,
                  fontSize: "0.83rem", border: "none", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer"
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          For questions about your data, email{" "}
          <a href="mailto:privacy@asur.in" style={{ color: "#f97316", textDecoration: "none" }}>privacy@asur.in</a>.
          Read our{" "}
          <Link href="/privacy" style={{ color: "#f97316", textDecoration: "none" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
