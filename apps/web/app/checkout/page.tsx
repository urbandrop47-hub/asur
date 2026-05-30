import { AppShell, Button, Pill, Timeline } from "@asur/ui";

const checkoutSteps = [
  { title: "Address", description: "Collect shipping and billing details, then persist them in MongoDB.", tone: "info" as const },
  { title: "Payment", description: "Create a Razorpay order before redirecting the user into a secure payment experience.", tone: "warning" as const },
  { title: "Confirmation", description: "Verify the signature, create the order, and assign a vendor task.", tone: "success" as const }
];

export default function CheckoutPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Checkout</h1>
          <p>The checkout flow is split into identity, payment, and order orchestration so each concern stays separate.</p>
        </div>
        <Button href="/orders">Review orders</Button>
      </div>

      <AppShell
        title="Checkout orchestration"
        subtitle="Frontend collects the minimum information it needs; backend does payment creation and verification."
      >
        <div className="actions">
          <Pill tone="info">Firebase session</Pill>
          <Pill tone="warning">Razorpay order</Pill>
          <Pill tone="success">Vendor task</Pill>
        </div>
      </AppShell>

      <div className="grid-2">
        <article className="summary-card">
          <div className="body stack">
            <strong>Why this split works</strong>
            <p>
              Controllers only parse requests, services own business logic, and repositories own persistence. That keeps the flow easy to evolve as ASUR adds more drops and more fulfillment partners.
            </p>
          </div>
        </article>
        <article className="summary-card">
          <div className="body stack">
            <strong>Primary dependencies</strong>
            <p>Firebase Authentication, Razorpay, MongoDB Atlas, Cloudflare R2, and a server-generated session layer.</p>
          </div>
        </article>
      </div>

      <Timeline steps={checkoutSteps} />
    </div>
  );
}
