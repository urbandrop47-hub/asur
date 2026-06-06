import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — ASUR",
  description: "Questions about ordering, shipping, returns, sizing, and the ASUR drop model.",
  alternates: { canonical: "https://weareasur.in/faq" }
};

const faqs: { q: string; a: string }[] = [
  {
    q: "How do I place an order?",
    a: "Pick your size, add to cart, checkout. You'll need an account — takes 30 seconds. Payment goes through Razorpay. That's it.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI (GPay, PhonePe, Paytm), cards, net banking, and EMI — all handled by Razorpay. We don't store your payment information.",
  },
  {
    q: "How long does delivery take?",
    a: "We ship within 1–2 business days. Delivery is 3–7 business days depending on your pin code. Pan-India. You'll get a tracking email when we ship.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes — orders above ₹1,500 ship free. Below that, it's a flat ₹250.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes, but only before it's been packed. Go to your Orders page and cancel from there. Once packed, we can't stop it — but you can return it after delivery within 7 days.",
  },
  {
    q: "What's your return policy?",
    a: "7 days from delivery. Items must be unworn and unwashed, tags intact. Sale items are final. Visit /returns to start one from your Orders page.",
  },
  {
    q: "How long do refunds take?",
    a: "We process refunds within 2–3 business days of receiving the return. Your bank may take another 5–7 days. UPI refunds tend to be faster.",
  },
  {
    q: "Why don't you do exchanges?",
    a: "Because our stock is limited and sizes disappear fast. Return the item for a full refund, then reorder in the right size. Cleaner for everyone.",
  },
  {
    q: "How do I find my size?",
    a: "Every product page has a size guide — tap 'Size Guide' next to the size selector. Our Oversized fits intentionally run larger; the guide notes this per product.",
  },
  {
    q: "Are products restocked?",
    a: "Rarely, and never guaranteed. ASUR runs on a drop model — each collection is made once. If something's sold out, sign up for back-in-stock alerts on the product page.",
  },
  {
    q: "How do I track my order?",
    a: "Check your Orders page at /orders and click any order for status and tracking. You'll also get an email with tracking info when we ship.",
  },
  {
    q: "I got the wrong item or something's damaged.",
    a: "Email us at support@weareasur.in within 48 hours of delivery with your order number and photos. We'll sort a free pickup and send a replacement or issue a full refund.",
  },
  {
    q: "I forgot to apply my coupon code.",
    a: "Coupon codes can't be applied after payment. Apply it at checkout next time — there's a field on the review step.",
  },
  {
    q: "How do I delete my account or export my data?",
    a: "Go to Account → Notifications. From there you can request a full data export or delete your account. Deletion anonymises your personal data while keeping order records for compliance.",
  },
  {
    q: "Do you ship internationally?",
    a: "Not yet. India only for now. Sign up for the newsletter — we'll announce when international shipping opens.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003C").replace(/>/g, "\\u003E") }}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <div style={{ marginBottom: "2.75rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
            Help
          </p>
          <h1 style={{ margin: "0 0 0.6rem", fontSize: "clamp(1.8rem, 4vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Questions
          </h1>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Can&apos;t find an answer?{" "}
            <a href="mailto:support@weareasur.in" style={{ color: "#f97316", textDecoration: "none" }}>
              support@weareasur.in
            </a>
          </p>
        </div>

        <div style={{ display: "grid", gap: "0.4rem" }}>
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <summary
                style={{
                  padding: "1rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  userSelect: "none",
                }}
              >
                {q}
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ flexShrink: 0, opacity: 0.4 }}
                  className="faq-chevron"
                  aria-hidden="true"
                >
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div
                style={{
                  padding: "0 1.25rem 1rem",
                  fontSize: "0.88rem",
                  lineHeight: 1.75,
                  color: "rgba(246,241,234,0.62)",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p style={{ margin: "0.75rem 0 0" }}>{a}</p>
              </div>
            </details>
          ))}
        </div>

        <div style={{ marginTop: "2.5rem", padding: "1.25rem", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
          <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.9rem" }}>Still stuck?</p>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)" }}>
            <a href="mailto:support@weareasur.in" style={{ color: "#f97316", textDecoration: "none" }}>support@weareasur.in</a>
            {" "}— we reply within 24 hours on business days.
          </p>
        </div>
      </div>
    </>
  );
}
