import Link from "next/link";
import { APP_NAME } from "@asur/constants";
import { NewsletterSignup } from "./newsletter-signup";

const SHOP_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Orders", href: "/orders" },
  { label: "Account", href: "/account" },
];

const LEGAL_LINKS = [
  { label: "About ASUR", href: "/about" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
  { label: "Returns & refunds", href: "/returns" },
  { label: "FAQ", href: "/faq" },
];

const TRUST_BADGES = [
  "🔒 Razorpay secured",
  "🚚 Pan-India delivery",
  "↩️ 7-day returns",
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      marginTop: "3rem",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))",
    }}>
      <div style={{
        width: "min(1180px, calc(100vw - 2rem))",
        margin: "0 auto",
        padding: "3rem 0 1.75rem",
        display: "grid",
        gap: "2.5rem",
      }}>

        {/* ── Top row ─────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2rem",
          alignItems: "start",
        }}>
          {/* Brand */}
          <div style={{ display: "grid", gap: "0.9rem", maxWidth: 380 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #f97316, #fb7185)",
                boxShadow: "0 4px 18px rgba(249,115,22,0.28)",
              }} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {APP_NAME}
                </p>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(246,241,234,0.38)", letterSpacing: "0.06em" }}>
                  Neither Divine. Nor Damned.
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "0.83rem", color: "rgba(246,241,234,0.48)", lineHeight: 1.75 }}>
              Premium Indian streetwear built for drop culture.
              Limited quantities. Single price. No restocks.
            </p>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              {TRUST_BADGES.map((b) => (
                <span key={b} style={{
                  padding: "0.25rem 0.6rem", borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "0.68rem", color: "rgba(246,241,234,0.4)",
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "0 3.5rem" }}>
            {[
              { heading: "Shop", links: SHOP_LINKS },
              { heading: "Legal", links: LEGAL_LINKS },
            ].map(({ heading, links }) => (
              <div key={heading} style={{ display: "grid", gap: "0.6rem", alignContent: "start" }}>
                <p style={{
                  margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "rgba(246,241,234,0.3)",
                }}>
                  {heading}
                </p>
                {links.map(({ label, href }) => (
                  <Link
                    key={href} href={href}
                    style={{ fontSize: "0.84rem", color: "rgba(246,241,234,0.55)", textDecoration: "none" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Newsletter row ───────────────────────────────────── */}
        <div style={{
          padding: "1.75rem",
          borderRadius: 16,
          background: "rgba(249,115,22,0.05)",
          border: "1px solid rgba(249,115,22,0.12)",
          display: "grid",
          gap: "1rem",
        }}>
          <div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.88rem", color: "var(--text)", letterSpacing: "0.02em" }}>
              Drop alerts &amp; exclusive offers
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(246,241,234,0.45)" }}>
              No spam. First-access invites only. Unsubscribe any time.
            </p>
          </div>
          <NewsletterSignup source="footer" />
        </div>

        {/* ── Bottom row ───────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "0.65rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(246,241,234,0.28)" }}>
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <p style={{
            margin: 0, fontSize: "0.7rem",
            fontFamily: "var(--f-mono)", letterSpacing: "0.06em",
            color: "rgba(246,241,234,0.2)",
          }}>
            Next.js · Express · MongoDB · Razorpay
          </p>
        </div>
      </div>
    </footer>
  );
}
