import { AppShell, Pill, Timeline } from "@asur/ui";

const orderStages = [
  { title: "Paid", description: "The payment gateway verifies the payment before the order is committed.", tone: "success" as const },
  { title: "Assigned", description: "A vendor task is generated for the offline fulfillment partner.", tone: "info" as const },
  { title: "Shipped", description: "Tracking is uploaded, notified to the customer, and kept visible in the dashboard.", tone: "warning" as const }
];

export default function OrdersPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Orders</h1>
          <p>Track order status and vendor fulfillment from a single domain model.</p>
        </div>
      </div>

      <AppShell title="Order timeline" subtitle="One order travels through payment, vendor assignment, packing, tracking, and completion.">
        <div className="actions">
          <Pill tone="success">Payment captured</Pill>
          <Pill tone="info">Vendor assigned</Pill>
          <Pill tone="warning">Tracking updates</Pill>
        </div>
      </AppShell>

      <Timeline steps={orderStages} />
    </div>
  );
}
