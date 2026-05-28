import Link from "next/link";
import { AppShell, Button, MetricCard, Pill, Timeline } from "@asur/ui";
import { commerceBlueprint, releaseWorkflow } from "../lib/catalog";
import { authFeature } from "../features/auth";
import { cartFeature } from "../features/cart";
import { checkoutFeature } from "../features/checkout";
import { ordersFeature } from "../features/orders";
import { productsFeature } from "../features/products";
import { accountFeature } from "../features/account";

const featureBlocks = [authFeature, cartFeature, checkoutFeature, productsFeature, ordersFeature, accountFeature];

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero-grid">
        <AppShell
          title="ASUR Commerce Platform"
          subtitle="A premium streetwear storefront, vendor workflow, and headless backend stack designed for drops, offline fulfillment, and mobile-first conversions."
          actions={
            <>
              <Button href="/products">Browse products</Button>
              <Button href="/checkout" variant="ghost">
                Review checkout
              </Button>
            </>
          }
        >
          <div className="stack">
            <div className="actions">
              <Pill tone="success">Next.js storefront</Pill>
              <Pill tone="info">Firebase auth</Pill>
              <Pill tone="warning">Razorpay + R2</Pill>
            </div>
            <div className="metrics">
              <MetricCard label="MVP scope" value="Phase 1" detail="Auth, catalog, cart, checkout, payments, orders." />
              <MetricCard label="Fulfillment" value="Offline vendors" detail="Vendor tasks, tracking uploads, and status updates." />
              <MetricCard label="Backend" value="Express + TS" detail="Controller, service, repository boundaries." />
              <MetricCard label="State" value="Zustand" detail="Cart and UI state remain lightweight and predictable." />
            </div>
          </div>
        </AppShell>

        <div className="stack">
          <div className="card-surface panel stack">
            <div className="section-title" style={{ margin: 0 }}>
              <div>
                <h2 style={{ margin: 0 }}>Architecture snapshot</h2>
                <p>Core infrastructure mapped to the actual product flow.</p>
              </div>
            </div>
            {commerceBlueprint.map((item) => (
              <div key={item.title} className="flow-card">
                <div className="body">
                  <strong>{item.title}</strong>
                  <p style={{ margin: "0.35rem 0 0" }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card-surface panel">
            <div className="section-title" style={{ margin: 0 }}>
              <div>
                <h2 style={{ margin: 0 }}>Release workflow</h2>
                <p>How the storefront moves from browse to fulfillment.</p>
              </div>
            </div>
            <Timeline
              steps={releaseWorkflow.map((step) => ({
                ...step,
                tone: step.title === "Fulfill" ? "success" : step.title === "Pay" ? "warning" : "info"
              }))}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <div>
            <h1>Feature-led structure</h1>
            <p>Each core journey is isolated into a feature slice so the app stays maintainable as the product grows.</p>
          </div>
          <Link className="badge" href="/account">
            View account surface
          </Link>
        </div>
        <div className="grid-3">
          {featureBlocks.map((feature) => (
            <article key={feature.title} className="summary-card">
              <div className="body stack">
                <strong>{feature.title}</strong>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)" }}>
                  {feature.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
