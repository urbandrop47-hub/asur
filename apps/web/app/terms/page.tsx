import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing your use of the ASUR website and purchase of ASUR products.",
  alternates: { canonical: "https://weareasur.in/terms" }
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.25rem" }}>
    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text)" }}>{title}</h2>
    <div style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)" }}>
      {children}
    </div>
  </section>
);

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Legal
        </p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: 800 }}>Terms of Use</h1>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>
          Last updated: June 2026 · Effective: June 2026
        </p>
      </div>

      <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)", marginBottom: "2rem", padding: "1.25rem", borderRadius: 12, border: "1px solid rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.05)" }}>
        By accessing or using weareasur.in ("the Site") or purchasing any ASUR product, you agree to be bound by these Terms of Use. Please read them carefully before using the Site.
      </p>

      <Section title="1. Acceptance of Terms">
        <p>These Terms of Use ("Terms") constitute a legally binding agreement between you and ASUR ("Company", "we", "our"). By creating an account, adding items to cart, or completing a purchase, you confirm you are at least 18 years old (or have parental consent) and accept these Terms and our Privacy Policy.</p>
      </Section>

      <Section title="2. Products & Pricing">
        <p><strong>Limited drops:</strong> ASUR releases products in limited quantities. Listing a product does not guarantee availability at time of checkout.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Pricing:</strong> All prices are displayed in Indian Rupees (₹) and include applicable GST unless stated otherwise. Shipping charges are shown at checkout. We reserve the right to change prices at any time without notice, but the price charged will be the price displayed at the time of your order confirmation.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Product images:</strong> We make every effort to display product colours and details accurately. Slight variations in colour may occur due to display settings.</p>
      </Section>

      <Section title="3. Orders & Payments">
        <p>An order is confirmed only after successful payment. We reserve the right to cancel any order at our discretion — for example, in cases of pricing errors, suspected fraud, or stock discrepancies. You will be fully refunded within 5–7 business days if we cancel your order.</p>
        <p style={{ marginTop: "0.75rem" }}>Payments are processed by Razorpay. By completing a payment, you also agree to Razorpay's Terms of Service. We do not store card details.</p>
      </Section>

      <Section title="4. Shipping & Delivery">
        <p>We ship across India. Estimated delivery times are 3–7 business days depending on your location. Delivery timelines are estimates and may be affected by logistics partners, weather, or holidays — we are not liable for delays beyond our control.</p>
        <p style={{ marginTop: "0.75rem" }}>Risk of loss and title for purchased items passes to you upon delivery to the shipping address you provided.</p>
      </Section>

      <Section title="5. Returns & Refunds">
        <p>Our returns policy is available at <a href="/returns" style={{ color: "#f97316", textDecoration: "none" }}>weareasur.in/returns</a>. Key terms: 7-day window from delivery, items must be unworn, unwashed, and in original packaging with tags attached. Sale items are final sale.</p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>All content on the Site — including text, graphics, logos, product photographs, and software — is the property of ASUR or its licensors and is protected by Indian copyright law and international treaties. You may not reproduce, distribute, modify, or create derivative works without our express written consent.</p>
      </Section>

      <Section title="7. User Accounts">
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately at support@weareasur.in if you suspect unauthorised use. We reserve the right to terminate accounts that violate these Terms.</p>
      </Section>

      <Section title="8. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", display: "grid", gap: "0.4rem" }}>
          <li>Use the Site for any unlawful purpose</li>
          <li>Attempt to gain unauthorised access to any system or account</li>
          <li>Submit false or misleading information</li>
          <li>Resell or commercially exploit products purchased from ASUR without permission</li>
          <li>Scrape, crawl, or systematically extract data from the Site</li>
          <li>Manipulate prices, exploit bugs, or abuse discount codes in ways unintended by us</li>
        </ul>
      </Section>

      <Section title="9. Disclaimer of Warranties">
        <p>THE SITE AND PRODUCTS ARE PROVIDED "AS IS". TO THE FULLEST EXTENT PERMITTED BY LAW, ASUR DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>To the maximum extent permitted by Indian law, ASUR's liability for any claim arising from these Terms or your use of the Site shall not exceed the amount you paid for the order giving rise to the claim. We are not liable for indirect, incidental, special, or consequential damages.</p>
      </Section>

      <Section title="11. Governing Law & Disputes">
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra. We encourage you to contact us first at support@weareasur.in to resolve issues amicably.</p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>We may update these Terms at any time. Material changes will be communicated via email or a notice on the Site. Continued use after changes constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>
          For legal or compliance enquiries: <strong>legal@weareasur.in</strong><br />
          For order or product support: <strong>support@weareasur.in</strong>
        </p>
      </Section>
    </div>
  );
}
