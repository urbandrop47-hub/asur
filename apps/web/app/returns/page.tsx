import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "ASUR's 7-day returns policy — how to request a return, eligible items, and refund timelines.",
  alternates: { canonical: "https://asur.in/returns" }
};

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #f97316, #fb7185)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.85rem", color: "#130f0b"
    }}>{n}</div>
    <div>
      <p style={{ margin: "0 0 0.3rem", fontWeight: 700, fontSize: "0.9rem" }}>{title}</p>
      <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(246,241,234,0.7)" }}>{children}</p>
    </div>
  </div>
);

export default function ReturnsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Legal
        </p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: 800 }}>Returns & Refunds</h1>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>
          Last updated: June 2026
        </p>
      </div>

      {/* Quick summary card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2.5rem" }}>
        {[
          { icon: "↩️", title: "7 days", sub: "from delivery date" },
          { icon: "✅", title: "Full refund", sub: "to original payment method" },
          { icon: "⏱️", title: "5–7 days", sub: "refund processing time" }
        ].map((item) => (
          <div key={item.title} style={{ padding: "1rem", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "1.3rem" }}>{item.icon}</p>
            <p style={{ margin: "0 0 0.15rem", fontWeight: 800, fontSize: "1rem" }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Eligibility */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem" }}>What can be returned?</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {[
            { ok: true, text: "Unworn, unwashed items with original tags attached" },
            { ok: true, text: "Items in original packaging" },
            { ok: true, text: "Items delivered within the past 7 days" },
            { ok: false, text: "Sale / clearance items (final sale — non-returnable)" },
            { ok: false, text: "Innerwear and swimwear (hygiene reasons)" },
            { ok: false, text: "Items that show signs of wear, washing, or damage" },
            { ok: false, text: "Items without original tags or packaging" },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(246,241,234,0.75)" }}>
              <span style={{ color: item.ok ? "#22c55e" : "#ef4444", flexShrink: 0, marginTop: "0.1rem" }}>{item.ok ? "✓" : "✕"}</span>
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* How to return */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1rem" }}>How to request a return</h2>
        <Step n={1} title="Go to your order">
          Visit <Link href="/orders" style={{ color: "#f97316", textDecoration: "none" }}>My Orders</Link>, find the delivered order, and click <strong>Request Return</strong> within 7 days of delivery.
        </Step>
        <Step n={2} title="Select items and reason">
          Choose which items you'd like to return and select a reason (wrong size, defective, changed my mind, etc.).
        </Step>
        <Step n={3} title="Pack and ship">
          We'll send you a confirmation email with instructions. Pack items securely in original packaging. You'll need to ship them to our fulfilment address (provided in the confirmation email). Return shipping costs are borne by the customer unless the item is defective or incorrectly shipped.
        </Step>
        <Step n={4} title="Inspection & refund">
          Once we receive and inspect the return (typically 2–3 business days), your refund will be initiated to your original payment method. Razorpay processes refunds within 5–7 business days after initiation.
        </Step>
      </section>

      {/* Defective / wrong items */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Defective or incorrectly shipped items</h2>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)" }}>
          If you received a defective, damaged, or incorrect item, please contact us at <strong>support@asur.in</strong> within 48 hours of delivery with photos of the item and packaging. We will arrange a free return pickup and send a replacement or full refund at no cost to you.
        </p>
      </section>

      {/* Exchange */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Exchanges</h2>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)" }}>
          We currently do not offer direct exchanges. ASUR operates on a drop model with limited stock — sizes and colours may sell out. Instead, return the original item and place a new order for the size or colour you want. Refunds are processed as described above.
        </p>
      </section>

      {/* Refund timeline */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Refund timeline</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {[
            ["UPI / Net Banking", "5–7 business days after return approved"],
            ["Credit / Debit Card", "5–7 business days (may take up to 10 days depending on your bank)"],
            ["Wallet (Paytm, PhonePe)", "1–3 business days"],
            ["ASUR store credit", "Instant, upon return approval (if you opt for credit)"]
          ].map(([method, timeline]) => (
            <div key={method} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "0.5rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
              <span style={{ fontWeight: 600 }}>{method}</span>
              <span style={{ color: "var(--text-muted)" }}>{timeline}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <div style={{ padding: "1.25rem", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.9rem" }}>Need help?</p>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
          Email us at <strong>support@asur.in</strong> — we respond within 24 hours on business days (Mon–Fri, 10am–6pm IST).
        </p>
      </div>
    </div>
  );
}
