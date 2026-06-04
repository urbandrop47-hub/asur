import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ASUR orders, shipping, returns, sizing, and more.",
  alternates: { canonical: "https://asur.in/faq" }
};

const faqs: { q: string; a: string }[] = [
  {
    q: "How do I place an order?",
    a: "Browse our products at /products, select your size and colour, add to cart, and proceed to checkout. You'll need to create a free account or sign in to complete your order. Payment is processed securely via Razorpay."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major UPI apps (Google Pay, PhonePe, Paytm), credit cards, debit cards, net banking, and EMI via Razorpay. All transactions are secured with 256-bit SSL encryption."
  },
  {
    q: "How long does delivery take?",
    a: "We typically ship within 1–2 business days of order confirmation. Delivery takes 3–7 business days depending on your location. We ship pan-India. You'll receive an email with tracking information once your order ships."
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes! Orders above ₹1,500 qualify for free shipping. Orders below ₹1,500 have a flat shipping fee of ₹250."
  },
  {
    q: "Can I cancel my order?",
    a: "Yes — you can cancel an order from your Orders page as long as it hasn't been packed yet. Once packed, cancellation is not possible, but you can return it after delivery within our 7-day window."
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for unworn, unwashed items with original tags. Sale items are final sale and cannot be returned. Visit /returns for full details and to initiate a return from your Orders page."
  },
  {
    q: "How long do refunds take?",
    a: "Refunds are initiated within 2–3 business days of us receiving and inspecting the return. After initiation, your bank may take 5–7 business days to credit the amount. UPI and wallet refunds are usually faster (1–3 days)."
  },
  {
    q: "Do you offer exchanges?",
    a: "We don't currently offer direct exchanges because our drops are limited-run and sizes may sell out quickly. Return the item for a full refund and place a new order for your preferred size. This ensures you get exactly what you want without delay."
  },
  {
    q: "How do I know which size to choose?",
    a: "We have a size guide on every product page — click 'Size Guide' next to the size selector. ASUR's signature styles run in standard Indian sizing. Our Oversized fits intentionally run larger; the size guide notes this for each product."
  },
  {
    q: "Are your products limited edition?",
    a: "Yes — ASUR operates on a drop model. Each collection releases in limited quantities and is not restocked once sold out. Sign up for back-in-stock alerts on any sold-out product to be notified if we ever restock."
  },
  {
    q: "Can I track my order?",
    a: "Yes. Once your order ships, you'll receive an email with tracking information. You can also visit your Orders page at /orders and click on any order to see its current status and tracking details."
  },
  {
    q: "My order was delivered but I received a wrong or defective item. What do I do?",
    a: "We're sorry! Email us at support@asur.in within 48 hours of delivery with your order number and photos of the issue. We'll arrange a free pickup and send a replacement or issue a full refund — whichever you prefer."
  },
  {
    q: "I forgot to apply my coupon code. Can you apply it retrospectively?",
    a: "Unfortunately, coupon codes cannot be applied to orders that have already been placed and paid. Make sure to enter your code at checkout before completing payment."
  },
  {
    q: "How do I delete my account or download my data?",
    a: "Go to Account → Notifications to manage your data and email preferences. You can download a full copy of your data (GDPR data export) or request account deletion. Account deletion anonymises your personal information while retaining order records for legal/tax purposes."
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship only within India. International shipping is on our roadmap. Sign up for our newsletter to hear when international shipping launches."
  }
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a }
  }))
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Help
          </p>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: 800 }}>Frequently asked questions</h1>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Can't find an answer? Email us at{" "}
            <a href="mailto:support@asur.in" style={{ color: "#f97316", textDecoration: "none" }}>support@asur.in</a>
          </p>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              <summary style={{
                padding: "1rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.92rem",
                cursor: "pointer",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                userSelect: "none"
              }}>
                {q}
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ flexShrink: 0, opacity: 0.5, transition: "transform 0.2s" }}
                  className="faq-chevron"
                  aria-hidden="true"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div style={{
                padding: "0 1.25rem 1rem",
                fontSize: "0.88rem",
                lineHeight: 1.75,
                color: "rgba(246,241,234,0.68)",
                borderTop: "1px solid rgba(255,255,255,0.05)"
              }}>
                <p style={{ margin: "0.75rem 0 0" }}>{a}</p>
              </div>
            </details>
          ))}
        </div>

        <div style={{ marginTop: "2.5rem", padding: "1.25rem", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.9rem" }}>Still need help?</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Reach us at{" "}
            <a href="mailto:support@asur.in" style={{ color: "#f97316", textDecoration: "none" }}>support@asur.in</a>
            {" "}— we reply within 24 hours on business days.
          </p>
        </div>
      </div>
    </>
  );
}
