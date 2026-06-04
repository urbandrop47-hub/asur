"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import type { Address } from "@asur/types";
import { firebaseAuth } from "../../lib/firebase";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../lib/api";

// ─── Shared styles ───────────────────────────────────────────

const inputStyle = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  color: "var(--text)",
  padding: "0.85rem 1rem",
  font: "inherit",
  fontSize: "0.95rem",
  outline: "none",
  minHeight: 48,
  boxSizing: "border-box" as const,
  WebkitAppearance: "none" as const,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "0.4rem",
};

const sectionLabel: React.CSSProperties = {
  margin: 0,
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const card: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "1.25rem",
};

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Chandigarh","Puducherry",
];

// ─── Edit profile form ───────────────────────────────────────

type ProfileFormState = { name: string; phoneNumber: string };
type ProfileErrors = Partial<Record<keyof ProfileFormState, string>>;

function EditProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileFormState;
  onSave: (patch: ProfileFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProfileFormState>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState("");

  function set(field: keyof ProfileFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setServerErr("");
  }

  async function handleSave() {
    const errs: ProfileErrors = {};
    if (form.name.trim().length < 1) errs.name = "Name is required";
    if (form.phoneNumber.trim() && !/^\+?[\d\s\-]{8,15}$/.test(form.phoneNumber.trim()))
      errs.phoneNumber = "Enter a valid phone number";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const patch: Record<string, string> = {};
      if (form.name.trim()) patch.name = form.name.trim();
      if (form.phoneNumber.trim()) patch.phoneNumber = form.phoneNumber.trim();
      await api.patch("/api/v1/auth/profile", patch);
      onSave(form);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerErr(msg ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.9rem", marginTop: "0.75rem" }}>
      <div>
        <label style={labelStyle}>Display name</label>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
        />
        {errors.name && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.name}</p>}
      </div>
      <div>
        <label style={labelStyle}>Phone number</label>
        <input
          style={inputStyle}
          value={form.phoneNumber}
          onChange={(e) => set("phoneNumber", e.target.value)}
          placeholder="+91 9876543210"
          type="tel"
        />
        {errors.phoneNumber && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.phoneNumber}</p>}
      </div>
      {serverErr && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--danger)" }}>{serverErr}</p>}
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, borderRadius: 999, padding: "0.75rem", fontWeight: 700,
            fontSize: "0.9rem", border: "none", cursor: saving ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", minHeight: 44,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1, borderRadius: 999, padding: "0.75rem", fontWeight: 600,
            fontSize: "0.9rem", border: "1px solid var(--border)", cursor: "pointer",
            background: "transparent", color: "var(--text)", minHeight: 44,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Add address form ────────────────────────────────────────

type AddrFormState = {
  fullName: string; phone: string; line1: string; line2: string;
  city: string; state: string; postalCode: string; country: string; label: string;
};
type AddrErrors = Partial<Record<keyof AddrFormState, string>>;

const blankAddr: AddrFormState = {
  fullName: "", phone: "", line1: "", line2: "",
  city: "", state: "", postalCode: "", country: "India", label: "",
};

function AddAddressForm({
  onSave,
  onCancel,
}: {
  onSave: (address: Address) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddrFormState>(blankAddr);
  const [errors, setErrors] = useState<AddrErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState("");

  function set(field: keyof AddrFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setServerErr("");
  }

  function validate(): AddrErrors {
    const e: AddrErrors = {};
    if (form.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!/^\+?[\d\s\-]{10,15}$/.test(form.phone.trim())) e.phone = "Enter a valid 10-digit phone number";
    if (form.line1.trim().length < 3) e.line1 = "Enter your street address";
    if (form.city.trim().length < 2) e.city = "Enter your city";
    if (form.state.trim().length < 2) e.state = "Select a state";
    if (!/^\d{4,10}$/.test(form.postalCode.trim())) e.postalCode = "Enter a valid pincode";
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const address: Address = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
      label: form.label.trim() || undefined,
    };

    setSaving(true);
    try {
      await api.post("/api/v1/auth/addresses", address);
      onSave(address);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerErr(msg ?? "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldErr = (field: keyof AddrErrors) =>
    errors[field] ? <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors[field]}</p> : null;

  return (
    <div style={{ display: "grid", gap: "0.85rem", marginTop: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Full name</label>
          <input style={inputStyle} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Doe" />
          {fieldErr("fullName")}
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 9876543210" type="tel" />
          {fieldErr("phone")}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Address line 1</label>
        <input style={inputStyle} value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Street, building, area" />
        {fieldErr("line1")}
      </div>
      <div>
        <label style={labelStyle}>Address line 2 (optional)</label>
        <input style={inputStyle} value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Apartment, floor, landmark" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>City</label>
          <input style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" />
          {fieldErr("city")}
        </div>
        <div>
          <label style={labelStyle}>Pincode</label>
          <input style={inputStyle} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="400001" inputMode="numeric" />
          {fieldErr("postalCode")}
        </div>
      </div>
      <div>
        <label style={labelStyle}>State</label>
        <select
          style={{ ...inputStyle, appearance: "none" as const }}
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
        >
          <option value="">Select state</option>
          {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {fieldErr("state")}
      </div>
      <div>
        <label style={labelStyle}>Label (optional)</label>
        <input style={inputStyle} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Home, Work, etc." />
      </div>
      {serverErr && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--danger)" }}>{serverErr}</p>}
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, borderRadius: 999, padding: "0.75rem", fontWeight: 700,
            fontSize: "0.9rem", border: "none", cursor: saving ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", minHeight: 44,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save address"}
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1, borderRadius: 999, padding: "0.75rem", fontWeight: 600,
            fontSize: "0.9rem", border: "1px solid var(--border)", cursor: "pointer",
            background: "transparent", color: "var(--text)", minHeight: 44,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Address card ────────────────────────────────────────────

function AddressCard({
  address,
  onDelete,
  deleting,
}: {
  address: Address;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.88rem" }}>
          {address.fullName}
          {address.label && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400, border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px" }}>
              {address.label}
            </span>
          )}
        </p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {address.phone}<br />
          {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
          {address.city}, {address.state} {address.postalCode}
        </p>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        title="Remove address"
        style={{
          flexShrink: 0, background: "transparent", border: "none", cursor: deleting ? "not-allowed" : "pointer",
          color: "var(--text-muted)", fontSize: "1rem", padding: "0.25rem", opacity: deleting ? 0.4 : 1,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { session, hydrated, clearSession, setSession } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { router.replace("/auth?next=/account"); return; }
    api
      .get<{ data: Address[] }>("/api/v1/auth/addresses")
      .then((r) => setAddresses(r.data ?? []))
      .catch(() => setAddressError(true))
      .finally(() => setAddressLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  const { user } = session;

  async function handleSignOut() {
    if (firebaseAuth) await signOut(firebaseAuth).catch(() => {});
    clearSession();
    router.push("/");
  }

  async function handleDeleteAddress(index: number) {
    setDeletingIndex(index);
    try {
      await api.del(`/api/v1/auth/addresses/${index}`);
      setAddresses((prev) => prev.filter((_, i) => i !== index));
    } catch {
      // leave list unchanged on error
    } finally {
      setDeletingIndex(null);
    }
  }

  function handleAddressSaved(address: Address) {
    setAddresses((prev) => [...prev, address]);
    setShowAddForm(false);
  }

  function handleProfileSaved(patch: ProfileFormState) {
    if (!session) return;
    setSession({
      sessionId: session.sessionId,
      provider: session.provider,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      user: {
        ...user,
        name: patch.name.trim() || user.name,
        phoneNumber: patch.phoneNumber.trim() || user.phoneNumber,
      },
    });
    setEditingProfile(false);
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.5rem" }}>
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Account</h1>

      {/* Profile card */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={sectionLabel}>Profile</p>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              style={{
                background: "transparent", border: "1px solid var(--border)", borderRadius: 8,
                padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600,
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Edit
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.1rem", color: "#130f0b",
          }}>
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            {user.name && <p style={{ margin: "0 0 0.1rem", fontWeight: 700, fontSize: "0.95rem" }}>{user.name}</p>}
            {user.email && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{user.email}</p>}
            {user.phoneNumber && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{user.phoneNumber}</p>}
          </div>
        </div>
        <div style={{ marginTop: "0.6rem" }}>
          <span style={{ fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px", color: "var(--text-muted)", textTransform: "capitalize" }}>
            {user.role.toLowerCase()}
          </span>
        </div>
        {editingProfile && (
          <EditProfileForm
            initial={{ name: user.name ?? "", phoneNumber: user.phoneNumber ?? "" }}
            onSave={handleProfileSaved}
            onCancel={() => setEditingProfile(false)}
          />
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        {[
          { href: "/orders", label: "Orders", icon: "📦" },
          { href: "/wishlist", label: "Wishlist", icon: "♡" },
          { href: "/orders", label: "Returns", icon: "↩" },
        ].map(({ href, label, icon }) => (
          <Link
            key={label}
            href={href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "0.4rem", border: "1px solid var(--border)", borderRadius: 14,
              padding: "1rem 0.5rem", textDecoration: "none", color: "var(--text)",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{icon}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Saved addresses */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={sectionLabel}>Saved addresses</p>
          {!showAddForm && addresses.length < 10 && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: "transparent", border: "1px solid var(--border)", borderRadius: 8,
                padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600,
                color: "var(--fire)", cursor: "pointer",
              }}
            >
              + Add
            </button>
          )}
        </div>

        {addressLoading ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          </div>
        ) : addressError ? (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Could not load addresses. Refresh to retry.
          </p>
        ) : addresses.length === 0 && !showAddForm ? (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No saved addresses yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {addresses.map((addr, i) => (
              <AddressCard
                key={i}
                address={addr}
                onDelete={() => handleDeleteAddress(i)}
                deleting={deletingIndex === i}
              />
            ))}
          </div>
        )}

        {showAddForm && (
          <AddAddressForm
            onSave={handleAddressSaved}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 999, padding: "0.9rem", fontSize: "0.92rem", fontWeight: 600,
          border: "1px solid rgba(255,80,80,0.3)", color: "var(--danger)",
          background: "transparent", cursor: "pointer", minHeight: 48, width: "100%",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
