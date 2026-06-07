"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Address, Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../store/auth-store";
import { useCartStore } from "../../store/cart-store";
import { useSiteConfigStore } from "../../store/site-config-store";
import { useLoyaltyStore } from "../../store/loyalty-store";
import { api } from "../../lib/api";
import { openRazorpayCheckout, mockRazorpayCheckout } from "../../lib/razorpay";
import { track } from "../../lib/analytics";

// ─── Step indicator ──────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Address", "Review", "Payment"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "2rem" }}>
      {steps.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done
                    ? "var(--success)"
                    : active
                      ? "linear-gradient(135deg, #f97316, #fb7185)"
                      : "rgba(255,255,255,0.08)",
                  border: active ? "none" : done ? "none" : "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: done || active ? (done ? "#0a0a0f" : "#130f0b") : "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                {done ? "✓" : num}
              </div>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text)" : done ? "var(--text-muted)" : "rgba(255,255,255,0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: done ? "var(--success)" : "rgba(255,255,255,0.1)",
                  margin: "0 0.75rem",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Address form ────────────────────────────────────

type AddressFormState = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type AddressErrors = Partial<Record<keyof AddressFormState, string>>;

function validateAddress(form: AddressFormState): AddressErrors {
  const errs: AddressErrors = {};
  if (form.fullName.trim().length < 2) errs.fullName = "Enter your full name";
  if (!/^\+?[\d\s\-]{10,15}$/.test(form.phone.trim())) errs.phone = "Enter a valid 10-digit phone number";
  if (form.line1.trim().length < 3) errs.line1 = "Enter your street address";
  if (form.city.trim().length < 2) errs.city = "Enter your city";
  if (form.state.trim().length < 2) errs.state = "Select a state";
  if (!/^\d{4,10}$/.test(form.postalCode.trim())) errs.postalCode = "Enter a valid pincode";
  return errs;
}

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Chandigarh","Puducherry","Andaman and Nicobar Islands","Lakshadweep",
  "Dadra and Nagar Haveli and Daman and Diu"
];

// India Post API state name → our INDIA_STATES value
const STATE_NAME_MAP: Record<string, string> = {
  "Orissa": "Odisha",
  "Uttaranchal": "Uttarakhand",
  "Pondicherry": "Puducherry",
  "Jammu And Kashmir": "Jammu and Kashmir",
  "Andaman And Nicobar Islands": "Andaman and Nicobar Islands",
  "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
  "Dadra And Nagar Haveli And Daman And Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra And Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman And Diu": "Dadra and Nagar Haveli and Daman and Diu",
};

function normaliseStateName(raw: string): string {
  return STATE_NAME_MAP[raw] ?? raw;
}

function AddressStep({
  savedAddresses,
  onConfirm
}: {
  savedAddresses: Address[];
  onConfirm: (address: Address) => void;
}) {
  const [form, setForm] = useState<AddressFormState>({
    fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India"
  });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [saving, setSaving] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [selectedSavedIdx, setSelectedSavedIdx] = useState<number | null>(null);
  const activePinRef = useRef<string>("");

  function set(field: keyof AddressFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSelectedSavedIdx(null);
  }

  function validateField(field: keyof AddressFormState, value: string) {
    const errs = validateAddress({ ...form, [field]: value });
    if (errs[field]) setErrors((e) => ({ ...e, [field]: errs[field] }));
  }

  async function autofillPincode(pin: string) {
    if (!/^\d{6}$/.test(pin)) return;
    activePinRef.current = pin;
    setPincodeLoading(true);
    setPincodeError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      // Bail out if a newer pincode was typed while this request was in flight
      if (activePinRef.current !== pin) return;
      if (!res.ok) { setPincodeError("Couldn't autofill — enter city/state manually"); return; }
      const data = await res.json() as Array<{ Status: string; PostOffice?: Array<{ District: string; State: string }> }>;
      if (activePinRef.current !== pin) return;
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setForm((f) => ({
          ...f,
          city: po.District || f.city,
          state: normaliseStateName(po.State) || f.state
        }));
        setErrors((e) => ({ ...e, city: undefined, state: undefined }));
      } else {
        setPincodeError("Pincode not found — enter city/state manually");
      }
    } catch {
      if (activePinRef.current === pin) setPincodeError("Couldn't autofill — enter city/state manually");
    } finally {
      if (activePinRef.current === pin) setPincodeLoading(false);
    }
  }

  function useSaved(addr: Address, idx: number) {
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country
    });
    setErrors({});
    setSelectedSavedIdx(idx);
  }

  async function handleSubmit() {
    const errs = validateAddress(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const address: Address = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country
    };

    try {
      await api.post("/api/v1/auth/addresses", address);
    } catch { /* non-fatal — address still used for this order */ }

    setSaving(false);
    onConfirm(address);
  }

  const inputStyle = {
    width: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", color: "var(--text)", padding: "0.85rem 1rem",
    font: "inherit", fontSize: "1rem", outline: "none", minHeight: 48,
    WebkitAppearance: "none" as const,
  };

  const labelStyle = { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.4rem" };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {savedAddresses.length > 0 && (
        <div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Saved addresses</p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {savedAddresses.map((addr, i) => {
              const isSelected = selectedSavedIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => useSaved(addr, i)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: isSelected ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isSelected ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 12, padding: "0.85rem 1rem",
                    color: "var(--text)", cursor: "pointer", fontSize: "0.88rem", lineHeight: 1.5,
                    transition: "border-color 150ms, background 150ms",
                  }}
                >
                  {isSelected && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", display: "block", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>✓ Selected</span>}
                  <strong>{addr.fullName}</strong> · {addr.phone}<br />
                  {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        <div className="checkout-grid-2">
          <div>
            <label style={labelStyle}>Full name *</label>
            <input style={inputStyle} type="text" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} onBlur={(e) => validateField("fullName", e.target.value)} placeholder="Rahul Sharma" />
            {errors.fullName && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.fullName}</p>}
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input style={inputStyle} type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} onBlur={(e) => validateField("phone", e.target.value)} placeholder="+91 98765 43210" />
            {errors.phone && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Address line 1 *</label>
          <input style={inputStyle} type="text" autoComplete="address-line1" value={form.line1} onChange={(e) => set("line1", e.target.value)} onBlur={(e) => validateField("line1", e.target.value)} placeholder="42 MG Road" />
          {errors.line1 && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.line1}</p>}
        </div>

        <div>
          <label style={labelStyle}>Address line 2 <span style={{ color: "rgba(246,241,234,0.4)" }}>(optional)</span></label>
          <input style={inputStyle} type="text" autoComplete="address-line2" value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Apartment, suite, floor…" />
        </div>

        <div className="checkout-grid-2">
          <div>
            <label style={labelStyle}>City *</label>
            <input style={inputStyle} type="text" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} onBlur={(e) => validateField("city", e.target.value)} placeholder="Bengaluru" />
            {errors.city && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.city}</p>}
          </div>
          <div>
            <label style={labelStyle}>
              Pincode *{pincodeLoading && <span style={{ fontWeight: 400, color: "var(--accent)", marginLeft: "0.4rem" }}>Autofilling…</span>}
            </label>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={form.postalCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                set("postalCode", val);
                setPincodeError(null);
                if (val.length === 6) void autofillPincode(val);
              }}
              placeholder="560001"
              maxLength={6}
            />
            {errors.postalCode && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.postalCode}</p>}
            {pincodeError && !errors.postalCode && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>{pincodeError}</p>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>State *</label>
          <select
            style={{ ...inputStyle, appearance: "none" as const }}
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
          >
            <option value="">Select state</option>
            {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{errors.state}</p>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: "100%", borderRadius: 999, padding: "0.95rem", fontSize: "1rem", fontWeight: 700,
          background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b",
          border: "none", cursor: saving ? "not-allowed" : "pointer", minHeight: 52,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving…" : "Continue to review →"}
      </button>
    </div>
  );
}

// ─── Step 2: Order review ────────────────────────────────────

type AppliedCoupon = {
  code: string;
  discountAmount: number;
  freeShipping: boolean;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
};

type AppliedGiftCard = {
  code: string;
  balance: number;
  applicableAmount: number;
};

function ReviewStep({
  address,
  onBack,
  onConfirm,
  confirming,
  coupon,
  onCouponChange,
  loyaltyPointsToRedeem,
  onLoyaltyChange,
  giftCard,
  onGiftCardChange,
  initialCouponCode,
}: {
  address: Address;
  onBack: () => void;
  onConfirm: (coupon: AppliedCoupon | null, loyaltyPts: number, gc: AppliedGiftCard | null) => void;
  confirming?: boolean;
  coupon: AppliedCoupon | null;
  onCouponChange: (c: AppliedCoupon | null) => void;
  loyaltyPointsToRedeem: number;
  onLoyaltyChange: (pts: number) => void;
  giftCard: AppliedGiftCard | null;
  onGiftCardChange: (gc: AppliedGiftCard | null) => void;
  initialCouponCode?: string;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const { config } = useSiteConfigStore();
  const { points: availablePoints, redeemRate, minRedeem, loaded: loyaltyLoaded, fetchBalance } = useLoyaltyStore();

  const [couponInput, setCouponInput] = useState(coupon?.code ?? initialCouponCode ?? "");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  // Auto-apply a coupon passed via URL (e.g. from recovery email)
  useEffect(() => {
    if (initialCouponCode && !coupon) {
      setCouponInput(initialCouponCode);
      void (async () => {
        setValidating(true);
        try {
          const res = await api.post<{ data: AppliedCoupon }>("/api/v1/coupons/validate", {
            code: initialCouponCode,
            subtotal
          });
          onCouponChange(res.data);
        } catch { /* invalid or expired — leave input filled, user can see the error */ }
        setValidating(false);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [usePoints, setUsePoints] = useState(loyaltyPointsToRedeem > 0);
  const [gcInput, setGcInput] = useState(giftCard?.code.match(/.{1,4}/g)?.join("-") ?? "");
  const [gcError, setGcError] = useState<string | null>(null);
  const [gcValidating, setGcValidating] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal * 0.2 * redeemRate));
  const pointsToUse = usePoints ? maxRedeemable : 0;
  const loyaltyDiscount = Math.floor(pointsToUse / redeemRate);

  useEffect(() => {
    onLoyaltyChange(usePoints ? pointsToUse : 0);
  }, [usePoints, pointsToUse, onLoyaltyChange]);

  const discount = coupon?.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const baseShipping = subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;
  const shipping = coupon?.freeShipping ? 0 : baseShipping;
  const tax = Math.round(taxableAmount * config.gstRate);
  const gcDiscount = giftCard?.applicableAmount ?? 0;
  const total = Math.max(0, taxableAmount + shipping + tax - loyaltyDiscount - gcDiscount);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setCouponError(null);
    try {
      const res = await api.post<{ data: AppliedCoupon }>("/api/v1/coupons/validate", {
        code,
        subtotal
      });
      onCouponChange(res.data);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Invalid coupon";
      setCouponError(msg);
      onCouponChange(null);
    } finally {
      setValidating(false);
    }
  }

  function removeCoupon() {
    onCouponChange(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function applyGiftCard() {
    const code = gcInput.trim().toUpperCase().replace(/-/g, "");
    if (!code) return;
    setGcValidating(true);
    setGcError(null);
    try {
      const res = await api.post<{ data: AppliedGiftCard }>("/api/v1/gift-cards/validate", {
        code,
        orderTotal: total
      });
      onGiftCardChange(res.data);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Invalid gift card";
      setGcError(msg);
      onGiftCardChange(null);
    } finally {
      setGcValidating(false);
    }
  }

  function removeGiftCard() {
    onGiftCardChange(null);
    setGcInput("");
    setGcError(null);
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Cart items */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {items.map((item) => (
          <div key={item.variantSku} style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ width: 52, height: 64, borderRadius: 10, flexShrink: 0, background: "radial-gradient(circle at top left, rgba(251,113,133,0.4), transparent 60%), linear-gradient(135deg, rgba(15,23,42,0.95), rgba(2,6,23,0.8))" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{item.productTitle}</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>{item.size} · {item.color} · ×{item.quantity}</p>
            </div>
            <strong style={{ fontSize: "0.9rem", flexShrink: 0 }}>{formatCurrency(item.unitPrice * item.quantity)}</strong>
          </div>
        ))}
      </div>

      {/* ── Coupon field (T5 + T6) ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
        <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Discount code
        </p>

        {coupon ? (
          /* Applied state */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>
                {coupon.code}
              </span>
              <span style={{ fontSize: "0.83rem", color: "var(--success)" }}>
                {coupon.freeShipping ? "Free shipping applied" : `−${formatCurrency(coupon.discountAmount)}`}
              </span>
            </div>
            <button onClick={removeCoupon} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px" }}>
              Remove
            </button>
          </div>
        ) : (
          /* Entry state */
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              placeholder="LAUNCH20"
              style={{
                flex: 1, padding: "0.65rem 0.9rem", borderRadius: 999,
                border: `1px solid ${couponError ? "var(--danger)" : "rgba(255,255,255,0.14)"}`,
                background: "rgba(255,255,255,0.05)", color: "var(--text)",
                fontFamily: "monospace", fontSize: "0.92rem", letterSpacing: "0.08em", outline: "none"
              }}
            />
            <button
              onClick={applyCoupon}
              disabled={!couponInput.trim() || validating}
              style={{
                padding: "0.65rem 1.1rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem",
                background: couponInput.trim() ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.3)", color: "var(--accent)",
                cursor: couponInput.trim() && !validating ? "pointer" : "not-allowed", flexShrink: 0
              }}
            >
              {validating ? "…" : "Apply"}
            </button>
          </div>
        )}

        {/* T6 — contextual error messages */}
        {couponError && (
          <p style={{ margin: "0.45rem 0 0", fontSize: "0.8rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6.5 4v3.5M6.5 9.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {couponError}
          </p>
        )}
      </div>

      {/* ── Gift card field ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
        <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Gift card
        </p>

        {giftCard ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>
                {giftCard.code.match(/.{1,4}/g)?.join("-")}
              </span>
              <span style={{ fontSize: "0.83rem", color: "var(--success)" }}>
                −{formatCurrency(giftCard.applicableAmount)}
              </span>
            </div>
            <button onClick={removeGiftCard} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px" }}>
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={gcInput}
              onChange={(e) => { setGcInput(e.target.value.toUpperCase()); setGcError(null); }}
              onKeyDown={(e) => e.key === "Enter" && applyGiftCard()}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              style={{
                flex: 1, padding: "0.65rem 0.9rem", borderRadius: 999,
                border: `1px solid ${gcError ? "var(--danger)" : "rgba(255,255,255,0.14)"}`,
                background: "rgba(255,255,255,0.05)", color: "var(--text)",
                fontFamily: "monospace", fontSize: "0.88rem", letterSpacing: "0.1em", outline: "none"
              }}
            />
            <button
              onClick={applyGiftCard}
              disabled={!gcInput.trim() || gcValidating}
              style={{
                padding: "0.65rem 1.1rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem",
                background: gcInput.trim() ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.3)", color: "var(--accent)",
                cursor: gcInput.trim() && !gcValidating ? "pointer" : "not-allowed", flexShrink: 0
              }}
            >
              {gcValidating ? "…" : "Apply"}
            </button>
          </div>
        )}

        {gcError && (
          <p style={{ margin: "0.45rem 0 0", fontSize: "0.8rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6.5 4v3.5M6.5 9.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {gcError}
          </p>
        )}
      </div>

      {/* Loyalty points redemption */}
      {loyaltyLoaded && availablePoints >= minRedeem && (
        <div style={{ border: `1px solid ${usePoints ? "rgba(249,115,22,0.4)" : "var(--border)"}`, borderRadius: 16, padding: "1rem", transition: "border-color 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div>
              <p style={{ margin: "0 0 0.2rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                Use loyalty points
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {availablePoints} pts available · Save ₹{Math.floor(maxRedeemable / redeemRate)} with {maxRedeemable} pts
              </p>
            </div>
            <button
              role="switch"
              aria-checked={usePoints}
              onClick={() => setUsePoints((v) => !v)}
              style={{
                flexShrink: 0, width: 44, height: 24, borderRadius: 99,
                background: usePoints ? "#f97316" : "rgba(255,255,255,0.12)",
                border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s"
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: usePoints ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", display: "block"
              }} />
            </button>
          </div>
          {usePoints && loyaltyDiscount > 0 && (
            <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: "#f97316", fontWeight: 600 }}>
              −₹{loyaltyDiscount} applied using {pointsToUse} points
            </p>
          )}
        </div>
      )}

      {/* Shipping address */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shipping to</p>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Edit</button>
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>
          <strong>{address.fullName}</strong> · {address.phone}<br />
          {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
          {address.city}, {address.state} {address.postalCode}
        </p>
      </div>

      {/* Price breakdown */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem", display: "grid", gap: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {coupon && discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--success)" }}>Discount ({coupon.code})</span>
            <span style={{ color: "var(--success)" }}>−{formatCurrency(discount)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Shipping</span>
          <span style={{ color: shipping === 0 ? "var(--success)" : "var(--text)" }}>
            {shipping === 0 ? (coupon?.freeShipping ? "Free (coupon)" : "Free") : formatCurrency(shipping)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>GST ({Math.round(config.gstRate * 100)}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        {loyaltyDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "#f97316" }}>Loyalty points ({pointsToUse} pts)</span>
            <span style={{ color: "#f97316" }}>−{formatCurrency(loyaltyDiscount)}</span>
          </div>
        )}
        {gcDiscount > 0 && giftCard && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--success)" }}>Gift card ({giftCard.code.match(/.{1,4}/g)?.join("-")})</span>
            <span style={{ color: "var(--success)" }}>−{formatCurrency(gcDiscount)}</span>
          </div>
        )}
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.2rem 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem" }}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Trust signals */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {["🔒 Razorpay secured", "7-day returns", "No hidden fees"].map((t) => (
          <span key={t} style={{ fontSize: "0.72rem", color: "rgba(246,241,234,0.35)" }}>{t}</span>
        ))}
      </div>

      {/* Sticky CTA — sticks to bottom of viewport on mobile, sits inline on desktop */}
      <div style={{
        position: "sticky",
        bottom: 0,
        zIndex: 20,
        background: "linear-gradient(to bottom, transparent 0%, #06070b 28%)",
        paddingTop: "1.25rem",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        marginTop: "0.25rem",
      }}>
        <button
          onClick={() => onConfirm(coupon, pointsToUse, giftCard)}
          disabled={confirming}
          style={{
            width: "100%", borderRadius: 999, padding: "0.95rem", fontSize: "1rem", fontWeight: 700,
            background: confirming ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b", border: "none",
            cursor: confirming ? "not-allowed" : "pointer", minHeight: 52,
            opacity: confirming ? 0.7 : 1, transition: "opacity 0.15s",
            boxShadow: "0 -8px 24px rgba(249,115,22,0.18)"
          }}
        >
          {confirming ? "Processing…" : `Place order — ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main checkout page ──────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCoupon = searchParams.get("coupon")?.toUpperCase() ?? undefined;
  const session = useAuthStore((s) => s.session);
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loyaltyPtsToRedeem, setLoyaltyPtsToRedeem] = useState(0);
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  // Tracks the pending order created before Razorpay opens — reused on retry
  // so we don't create a second orphaned order if the user dismisses the modal.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Guest checkout — phone number collected before address step
  const [guestPhone, setGuestPhone] = useState("");
  const [guestPhoneInput, setGuestPhoneInput] = useState("");
  const [guestPhoneError, setGuestPhoneError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // If signed in: load saved addresses + track checkout_started
  // If guest: allow checkout without redirect
  useEffect(() => {
    if (!mounted) return;
    if (cartItems.length > 0) track("checkout_started", { itemCount: cartItems.length });
  }, [mounted, cartItems.length]);

  // Load saved addresses (only for signed-in users)
  useEffect(() => {
    if (!session) return;
    api.get<{ data: Address[] }>("/api/v1/auth/addresses")
      .then((r) => setSavedAddresses(r.data ?? []))
      .catch(() => {});
  }, [session]);

  if (!mounted) {
    return (
      <div style={{ paddingTop: "3rem", display: "grid", gap: "1.25rem", maxWidth: 560, margin: "0 auto" }}>
        <div className="skeleton skeleton-line" style={{ height: 36, width: "30%" }} />
        <div className="skeleton skeleton-line" style={{ height: 300, borderRadius: 20 }} />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Your cart is empty</h2>
        <p>Add some items before checking out.</p>
        <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "0.85rem 1.5rem", background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", fontWeight: 700, fontSize: "0.92rem", textDecoration: "none" }}>
          Browse products
        </Link>
      </div>
    );
  }

  function syncAbandonedCart(email: string) {
    if (!email || cartItems.length === 0) return;
    void api.post("/api/v1/abandoned-cart/sync", {
      email,
      customerName: session?.user.name ?? undefined,
      items: cartItems.map((i) => ({
        productId: i.productId,
        variantSku: i.variantSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productTitle: i.productTitle,
        productSlug: i.productSlug,
        imageUrl: i.imageUrl,
        size: i.size,
        color: i.color,
      })),
      subtotal,
    }).catch(() => {});
  }

  function getReferralCodeFromCookie(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(/(?:^|;\s*)referral_code=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  async function handlePayment(confirmedAddress: Address, coupon: AppliedCoupon | null, loyaltyPts = 0, gc: AppliedGiftCard | null = null) {
    setProcessing(true);
    setError(null);

    // Resolve the phone used for Razorpay contact — guest phone or address phone
    const contactPhone = confirmedAddress.phone;

    try {
      // 1. Create backend order (or reuse a pending one from a prior dismissed attempt)
      let order: Order;
      if (pendingOrderId) {
        const guestPhoneParam = !session && guestPhone ? `?guestPhone=${encodeURIComponent(guestPhone)}` : "";
        const existingRes = await api.get<{ data: Order }>(`/api/v1/orders/${pendingOrderId}${guestPhoneParam}`);
        order = existingRes.data;
      } else {
        const referralCode = getReferralCodeFromCookie();
        const orderRes = await api.post<{ data: { order: Order } }>("/api/v1/orders", {
          items: cartItems.map((i) => ({
            productId: i.productId,
            variantSku: i.variantSku,
            quantity: i.quantity,
            unitPrice: i.unitPrice
          })),
          shippingAddress: confirmedAddress,
          // Guest: send guestPhone so the order can be linked on sign-in later
          ...(!session && guestPhone ? { guestPhone } : {}),
          ...(coupon ? { couponCode: coupon.code } : {}),
          // Loyalty + gift card only available to signed-in customers
          ...(session && loyaltyPts > 0 ? { loyaltyPointsToRedeem: loyaltyPts } : {}),
          ...(referralCode ? { referralCode } : {}),
          ...(session && gc ? { giftCardCode: gc.code } : {})
        });
        order = orderRes.data.order;
        setPendingOrderId(order.id);
      }

      // Persist guestPhone in sessionStorage so confirmation page can fetch the order
      // on F5 or revisit after the URL param is lost. Written here (not just in the
      // new-order branch above) so pendingOrderId retries also get the entry.
      if (!session && guestPhone) {
        try { sessionStorage.setItem(`guest_order_${order.id}`, guestPhone); } catch {
          // sessionStorage unavailable (e.g. iOS Safari Private Browsing).
          // The ?guestPhone= query param in the confirmation URL is the primary mechanism —
          // sessionStorage is only a fallback for revisiting a bookmarked confirmation URL.
          // No action needed; the confirmation URL itself always carries the phone.
        }
      }

      // Use the server-computed total — never re-derive from client cart prices,
      // which may differ if the catalogue changed between add-to-cart and checkout.
      const totalPaise = Math.round((order.total ?? 0) * 100);

      // 2. Create Razorpay payment order (amount in paise).
      //    If the server returns zeroCost=true the order was already completed
      //    (gift card / loyalty covered 100%) — skip straight to confirmation.
      const payRes = await api.post<{ data: { providerOrderId?: string | null; id?: string; amount: number; zeroCost?: boolean } }>(
        "/api/v1/payments/razorpay/order",
        { orderId: order.id, ...(!session && guestPhone ? { guestPhone } : {}) }
      );

      if (payRes.data.zeroCost) {
        setPendingOrderId(null);
        clearCart();
        if (session?.user.email) {
          void api.post("/api/v1/abandoned-cart/convert", { email: session.user.email }).catch(() => {});
        }
        router.push(`/orders/${order.id}/confirmation${!session && guestPhone ? `?guestPhone=${encodeURIComponent(guestPhone)}` : ""}`);
        return;
      }

      const providerOrderId = payRes.data.providerOrderId ?? payRes.data.id ?? `rzp_mock_${Date.now()}`;
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY ?? "";

      // 3. Open Razorpay modal (or mock it in dev)
      const openPayment = razorpayKey && typeof window !== "undefined" && window.Razorpay
        ? openRazorpayCheckout
        : (_opts: Parameters<typeof openRazorpayCheckout>[0]) => mockRazorpayCheckout(_opts);

      openPayment({
        key: razorpayKey,
        amount: totalPaise,
        currency: "INR",
        providerOrderId,
        orderId: order.id,
        name: "ASUR",
        email: session?.user.email ?? undefined,
        contact: contactPhone,
        onDismiss: () => {
          setProcessing(false);
          setStep(2); // return to review step so user can retry
          setError("Payment was cancelled. You can try again.");
        },
        onSuccess: async (payload) => {
          try {
            await api.post("/api/v1/payments/razorpay/verify", {
              orderId: order.id,
              razorpayOrderId: payload.razorpay_order_id,
              razorpayPaymentId: payload.razorpay_payment_id,
              razorpaySignature: payload.razorpay_signature,
              ...(!session && guestPhone ? { guestPhone } : {})
            });
            setPendingOrderId(null);
            clearCart();
            if (session?.user.email) {
              void api.post("/api/v1/abandoned-cart/convert", { email: session.user.email }).catch(() => {});
            }
            router.push(`/orders/${order.id}/confirmation${!session && guestPhone ? `?guestPhone=${encodeURIComponent(guestPhone)}` : ""}`);
          } catch {
            setError("Payment succeeded but verification failed. Please contact support with your order ID: " + order.id);
            setProcessing(false);
          }
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setProcessing(false);
      setStep(2); // return to review so user can retry
    }
  }

  // Guest phone capture: shown when not signed in and guestPhone not yet confirmed
  const showGuestPhoneCapture = !session && !guestPhone;

  function handleGuestPhoneConfirm() {
    let raw = guestPhoneInput.trim().replace(/\D/g, "");
    // Strip international prefixes before validating:
    //   0091XXXXXXXXXX (14 digits) → XXXXXXXXXX
    //   91XXXXXXXXXX   (12 digits) → XXXXXXXXXX
    if (raw.startsWith("0091") && raw.length === 14) raw = raw.slice(4);
    else if (raw.startsWith("91") && raw.length === 12) raw = raw.slice(2);
    if (raw.length !== 10) { setGuestPhoneError("Enter a valid 10-digit mobile number. Country code (+91, 91, or 0091) is stripped automatically if pasted."); return; }
    setGuestPhone(`+91${raw}`);
    setGuestPhoneError(null);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800 }}>Checkout</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}{session ? ` · ${session.user.email ?? session.user.name ?? ""}` : guestPhone ? ` · Guest · ${guestPhone}` : " · Guest checkout"}
        </p>
      </div>

      {/* ── Guest phone capture ── shown instead of steps until phone is entered */}
      {showGuestPhoneCapture && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "1.75rem", display: "grid", gap: "1.25rem" }}>
          <div>
            <p style={{ margin: "0 0 0.3rem", fontWeight: 700, fontSize: "1.05rem" }}>Continue as guest</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Your phone number lets you track this order and links it to your account if you sign in later.
            </p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
              Mobile number *
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span style={{ padding: "0 0.85rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", display: "flex", alignItems: "center", fontSize: "0.92rem", flexShrink: 0 }}>
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={guestPhoneInput}
                onChange={(e) => {
                  // Accept up to 15 raw digits — prefix stripping happens in handleGuestPhoneConfirm,
                  // not here, so pastes like 0091XXXXXXXXXX (14 digits) are never silently truncated.
                  setGuestPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 15));
                  setGuestPhoneError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleGuestPhoneConfirm()}
                placeholder="98765 43210"
                style={{ flex: 1, border: `1px solid ${guestPhoneError ? "var(--danger)" : "rgba(255,255,255,0.12)"}`, borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "var(--text)", padding: "0.85rem 1rem", font: "inherit", fontSize: "1rem", outline: "none", minHeight: 48 }}
              />
            </div>
            {guestPhoneError && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{guestPhoneError}</p>}
          </div>
          <button
            onClick={handleGuestPhoneConfirm}
            style={{ width: "100%", borderRadius: 999, padding: "0.95rem", fontSize: "1rem", fontWeight: 700, background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", border: "none", cursor: "pointer", minHeight: 52 }}
          >
            Continue to address →
          </button>
          <p style={{ margin: 0, textAlign: "center" as const, fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href={`/auth?next=/checkout`} style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>
        </div>
      )}

      {!showGuestPhoneCapture && <StepIndicator current={step} />}

      {!showGuestPhoneCapture && error && (
        <div className="error-banner" style={{ marginBottom: "1.5rem" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5v5M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {!showGuestPhoneCapture && processing && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <div style={{ marginBottom: "1rem" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true">
              <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <path d="M18 3 A15 15 0 0 1 33 18" stroke="url(#spinGrad)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="spinGrad" x1="18" y1="3" x2="33" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" />
                  <stop offset="1" stopColor="#fb7185" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 600 }}>Processing payment…</p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Please don&apos;t close this page</p>
        </div>
      )}

      {!showGuestPhoneCapture && !processing && step === 1 && (
        <AddressStep
          savedAddresses={savedAddresses}
          onConfirm={(addr) => {
            track("checkout_address_complete");
            setAddress(addr);
            setStep(2);
            if (session?.user.email) syncAbandonedCart(session.user.email);
          }}
        />
      )}

      {!showGuestPhoneCapture && !processing && step === 2 && address && (
        <ReviewStep
          address={address}
          onBack={() => setStep(1)}
          confirming={processing}
          coupon={appliedCoupon}
          onCouponChange={(c) => { setPendingOrderId(null); setAppliedCoupon(c); setAppliedGiftCard(null); }}
          loyaltyPointsToRedeem={loyaltyPtsToRedeem}
          onLoyaltyChange={(pts) => {
            if (pts !== loyaltyPtsToRedeem) { setPendingOrderId(null); setAppliedGiftCard(null); }
            setLoyaltyPtsToRedeem(pts);
          }}
          giftCard={appliedGiftCard}
          onGiftCardChange={(gc) => { setPendingOrderId(null); setAppliedGiftCard(gc); }}
          initialCouponCode={urlCoupon}
          onConfirm={(coupon, loyaltyPts, gc) => {
            if (processing) return;
            track("checkout_review_complete");
            setStep(3);
            handlePayment(address, coupon, loyaltyPts, gc);
          }}
        />
      )}
    </div>
  );
}
