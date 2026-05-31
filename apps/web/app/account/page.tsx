"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import type { Address } from "@asur/types";
import { firebaseAuth } from "../../lib/firebase";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../lib/api";

function AddressCard({ address }: { address: Address }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem" }}>
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
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { session, hydrated, clearSession } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/auth?next=/account");
      return;
    }
    api
      .get<{ data: Address[] }>("/api/v1/auth/addresses")
      .then((r) => setAddresses(r.data ?? []))
      .catch(() => setAddressError(true))
      .finally(() => setAddressLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  const { user } = session;

  async function handleSignOut() {
    if (firebaseAuth) {
      await signOut(firebaseAuth).catch(() => {});
    }
    clearSession();
    router.push("/");
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.5rem" }}>
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Account</h1>

      {/* Profile card */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Profile
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.1rem", color: "#130f0b"
          }}>
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            {user.name && <p style={{ margin: "0 0 0.1rem", fontWeight: 700, fontSize: "0.95rem" }}>{user.name}</p>}
            {user.email && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{user.email}</p>}
            {user.phoneNumber && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{user.phoneNumber}</p>}
          </div>
        </div>
        <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px", color: "var(--text-muted)", textTransform: "capitalize" }}>
            {user.role.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Order history link */}
      <Link
        href="/orders"
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: "1px solid var(--border)", borderRadius: 16, padding: "1rem 1.25rem",
          textDecoration: "none", color: "var(--text)"
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.15rem", fontWeight: 600, fontSize: "0.9rem" }}>Order history</p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>View your past orders and track shipments</p>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>→</span>
      </Link>

      {/* Saved addresses */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Saved addresses
          </p>
          <Link href="/checkout" style={{ fontSize: "0.8rem", color: "var(--fire)", textDecoration: "none", fontWeight: 600 }}>
            + Add
          </Link>
        </div>
        {addressLoading ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          </div>
        ) : addresses.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No saved addresses yet. They&apos;re saved automatically at checkout.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {addresses.map((addr, i) => (
              <AddressCard key={i} address={addr} />
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 999, padding: "0.9rem", fontSize: "0.92rem", fontWeight: 600,
          border: "1px solid rgba(255,80,80,0.3)", color: "var(--danger)",
          background: "transparent", cursor: "pointer", minHeight: 48, width: "100%"
        }}
      >
        Sign out
      </button>
    </div>
  );
}
