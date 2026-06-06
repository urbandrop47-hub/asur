import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ASUR collects, uses, and protects your personal data — in compliance with India's DPDP Act 2023 and GDPR.",
  alternates: { canonical: "https://weareasur.in/privacy" }
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.25rem" }}>
    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text)" }}>{title}</h2>
    <div style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)" }}>
      {children}
    </div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Legal
        </p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: 800 }}>Privacy Policy</h1>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>
          Last updated: June 2026 · Effective: June 2026
        </p>
      </div>

      <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)", marginBottom: "2rem", padding: "1.25rem", borderRadius: 12, border: "1px solid rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.05)" }}>
        ASUR ("we", "our", "us") is committed to protecting your personal data. This policy explains what we collect, why we collect it, how we use it, and your rights under India's Digital Personal Data Protection Act 2023 (DPDP Act) and the General Data Protection Regulation (GDPR).
      </p>

      <Section title="1. Who We Are">
        <p>ASUR is a premium Indian streetwear brand operating at <strong>weareasur.in</strong>. We are a data fiduciary under the DPDP Act 2023. For privacy queries, contact us at <strong>privacy@weareasur.in</strong>.</p>
      </Section>

      <Section title="2. Data We Collect">
        <p><strong>Account data:</strong> Name, email address, phone number, and profile photo when you create an account or sign in via Google/Firebase Authentication.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Order data:</strong> Shipping address, order items, payment status, and coupon codes when you place an order. We do not store your full card details — payments are processed by Razorpay.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Wishlist & activity:</strong> Products you save, reviews you write, and return requests you submit.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Technical data:</strong> IP address, browser type, device type, pages visited, and session duration via server logs and (with your consent) analytics cookies.</p>
        <p style={{ marginTop: "0.75rem" }}><strong>Communications:</strong> Emails you send us and your communication preferences.</p>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "grid", gap: "0.4rem" }}>
          <li>Processing and fulfilling your orders (legal basis: contract performance)</li>
          <li>Sending transactional emails — order confirmation, shipping updates, return status (legal basis: contract performance — cannot be opted out)</li>
          <li>Sending marketing emails about new drops and promotions (legal basis: consent — you can opt out at any time)</li>
          <li>Improving our website, products, and customer experience (legal basis: legitimate interest)</li>
          <li>Detecting fraud and ensuring security (legal basis: legitimate interest)</li>
          <li>Complying with legal obligations including GST filings (legal basis: legal obligation)</li>
        </ul>
      </Section>

      <section id="cookies" style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text)" }}>4. Cookies</h2>
        <div style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(246,241,234,0.72)" }}>
        <p>We use the following categories of cookies:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", display: "grid", gap: "0.4rem" }}>
          <li><strong>Essential:</strong> Authentication, cart persistence, security tokens. Cannot be disabled.</li>
          <li><strong>Analytics (with consent):</strong> Aggregate usage data to understand how customers navigate our store. Loaded only after you accept analytics cookies.</li>
          <li><strong>Marketing (with consent):</strong> Used for retargeting and measuring campaign effectiveness.</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>You can manage your cookie preferences at any time via the "Manage Preferences" banner or by clearing your browser's local storage.</p>
        </div>
      </section>

      <Section title="5. Data Sharing">
        <p>We share your data only as necessary:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", display: "grid", gap: "0.4rem" }}>
          <li><strong>Razorpay</strong> — payment processing (they are a separate data fiduciary)</li>
          <li><strong>Resend</strong> — transactional and marketing email delivery</li>
          <li><strong>Cloudflare</strong> — CDN, image delivery, and DDoS protection</li>
          <li><strong>MongoDB Atlas</strong> — database hosting (data stored in India or EU)</li>
          <li><strong>Google Firebase</strong> — authentication</li>
          <li><strong>Logistics partners</strong> — name and address for delivery (shared only upon shipment)</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>We do not sell your personal data to third parties. We do not share it for advertising purposes without consent.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain account data for as long as your account is active. Order records are retained for 7 years for tax/accounting compliance under the GST Act. If you delete your account, your personal information is anonymised within 30 days, but order records are retained for the required legal period.</p>
      </Section>

      <Section title="7. Your Rights">
        <p>Under the DPDP Act 2023 and GDPR, you have the right to:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", display: "grid", gap: "0.4rem" }}>
          <li><strong>Access</strong> — download a copy of all data we hold about you (via Account → Download my data)</li>
          <li><strong>Correction</strong> — update your name, phone, or email in Account settings</li>
          <li><strong>Erasure</strong> — delete your account and anonymise your personal data (via Account → Delete account)</li>
          <li><strong>Restrict processing</strong> — opt out of marketing emails at any time</li>
          <li><strong>Data portability</strong> — receive your data in a machine-readable format (JSON export)</li>
          <li><strong>Withdraw consent</strong> — for analytics/marketing cookies or marketing emails</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>To exercise these rights, visit your <strong>Account → Notifications</strong> page, or email <strong>privacy@weareasur.in</strong>. We will respond within 30 days.</p>
      </Section>

      <Section title="8. Security">
        <p>We implement industry-standard security: TLS 1.3 encryption in transit, bcrypt for tokens, MongoDB Atlas encryption at rest, rate limiting on all APIs, and Sentry for error monitoring. Payments are tokenised by Razorpay — we never see your card number.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>Our services are not directed at children under 13 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact privacy@weareasur.in and we will delete it promptly.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this policy as our practices or laws change. We will notify you of material changes by email (if you have opted in) and by updating the "Last updated" date above. Continued use of our services after changes constitutes acceptance.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          <strong>Email:</strong> privacy@weareasur.in<br />
          <strong>Grievance Officer (India):</strong> As required by the DPDP Act 2023, complaints can be directed to privacy@weareasur.in. We will respond within 30 days.
        </p>
      </Section>
    </div>
  );
}
