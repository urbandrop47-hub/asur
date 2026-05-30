import { AppShell, Pill, Timeline } from "@asur/ui";

const accountSections = [
  { title: "Profile", description: "Customer identity and saved details live in MongoDB, not the auth provider.", tone: "info" as const },
  { title: "Addresses", description: "Multiple shipping addresses are stored for quick checkout and repeat purchases.", tone: "success" as const },
  { title: "Orders", description: "Orders, payments, and review history can all sit under one customer surface.", tone: "warning" as const }
];

export default function AccountPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Account</h1>
          <p>Role-aware account surfaces keep customer, vendor, and admin experiences separated.</p>
        </div>
      </div>
      <AppShell title="Customer account" subtitle="A single customer can move between saved addresses, previous orders, and future drops without friction.">
        <div className="actions">
          <Pill tone="info">Addresses</Pill>
          <Pill tone="success">Wishlist</Pill>
          <Pill tone="warning">Review history</Pill>
        </div>
      </AppShell>
      <Timeline steps={accountSections} />
    </div>
  );
}
