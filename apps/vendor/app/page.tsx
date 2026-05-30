import { VendorShell } from "../components/vendor-shell";
import { vendorMetrics, vendorWorkflow } from "../lib/dashboard";
import { AppShell, MetricCard, Pill, Timeline } from "@asur/ui";

export default function VendorHomePage() {
  return (
    <div className="stack">
      <VendorShell />

      <div className="section-title">
        <div>
          <h1>Fulfillment workspace</h1>
          <p>Offline vendors can print, pack, and ship orders from a simple task-oriented dashboard.</p>
        </div>
        <Pill tone="success">Vendor online</Pill>
      </div>

      <div className="metric-grid">
        {vendorMetrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </div>

      <AppShell title="Vendor tasks" subtitle="The vendor dashboard is intentionally lean so the packing process stays fast and error-resistant.">
        <div className="grid-3">
          <article className="summary-card">
            <div className="panel stack">
              <strong>Today</strong>
              <p>12 orders ready for packing, 9 already shipped, and 5 awaiting tracking upload.</p>
            </div>
          </article>
          <article className="summary-card">
            <div className="panel stack">
              <strong>What the vendor can do</strong>
              <ul className="list">
                <li>View pending fulfillment tasks</li>
                <li>Mark items packed or shipped</li>
                <li>Upload tracking IDs</li>
                <li>Close out completed shipments</li>
              </ul>
            </div>
          </article>
          <article className="summary-card">
            <div className="panel stack">
              <strong>Backend contract</strong>
              <p>Vendor actions update the same order and shipment records used by admin and customer surfaces.</p>
            </div>
          </article>
        </div>
      </AppShell>

      <div className="grid-2">
        <article className="table-card">
          <div className="panel stack">
            <strong>Fulfillment flow</strong>
            <Timeline steps={vendorWorkflow.map((step, index) => ({ ...step, tone: index === 2 ? "success" : index === 0 ? "info" : "warning" }))} />
          </div>
        </article>
        <article className="table-card">
          <div className="panel stack">
            <strong>Typical task data</strong>
            <ul className="list">
              <li>Order number</li>
              <li>Variant SKU</li>
              <li>Shipping address label</li>
              <li>Tracking identifier</li>
              <li>Shipment status</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
