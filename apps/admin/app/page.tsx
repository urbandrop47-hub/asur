import { AdminShell } from "../components/admin-shell";
import { adminMetrics, adminQueues } from "../lib/dashboard";
import { AppShell, MetricCard, Pill, Timeline } from "@asur/ui";

export default function AdminHomePage() {
  return (
    <div className="stack">
      <AdminShell />
      <div className="section-title">
        <div>
          <h1>Operations overview</h1>
          <p>Everything the internal team needs to keep the storefront, vendors, and payments moving.</p>
        </div>
        <Pill tone="info">Internal only</Pill>
      </div>

      <div className="metric-grid">
        {adminMetrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </div>

      <AppShell title="Release command center" subtitle="Use this dashboard to coordinate content approvals, operational tasks, and commerce readiness.">
        <div className="grid-3">
          {adminQueues.map((queue) => (
            <article key={queue.title} className="summary-card">
              <div className="card-body stack">
                <strong>{queue.title}</strong>
                <ul className="list">
                  {queue.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </AppShell>

      <div className="grid-2">
        <article className="table-card">
          <div className="card-body stack">
            <strong>Data boundaries</strong>
            <p>
              Admin reads the same MongoDB collections as the storefront, but all mutations stay behind service-layer APIs.
            </p>
          </div>
        </article>
        <article className="table-card">
          <div className="card-body stack">
            <strong>Useful operational slices</strong>
            <Timeline
              steps={[
                { title: "Review", description: "Check product content and pricing before each drop.", tone: "info" },
                { title: "Approve", description: "Confirm vendor readiness and shipping labels.", tone: "warning" },
                { title: "Launch", description: "Turn catalog entries live and monitor payments.", tone: "success" }
              ]}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
