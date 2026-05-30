import { AppShell, Pill } from "@asur/ui";

export default function CollectionsPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Collections</h1>
          <p>Collections can map seasonal drops, capsules, collaborations, and limited launches.</p>
        </div>
      </div>
      <AppShell title="Collection strategy" subtitle="Keep the merch surface readable for both first-time visitors and repeat collectors.">
        <div className="actions">
          <Pill tone="info">Capsule drops</Pill>
          <Pill tone="success">Creator collabs</Pill>
          <Pill tone="warning">Limited release</Pill>
        </div>
      </AppShell>
    </div>
  );
}
