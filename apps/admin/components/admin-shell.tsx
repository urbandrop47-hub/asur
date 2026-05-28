import Link from "next/link";
import { APP_NAME } from "@asur/constants";

export function AdminShell() {
  return (
    <header className="admin-header">
      <div className="brand">
        <span className="brand-mark" />
        <span>
          <strong style={{ display: "block", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.8rem" }}>ASUR Admin</strong>
          <span style={{ color: "var(--text-muted)" }}>{APP_NAME} commerce operations</span>
        </span>
      </div>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="badge" href="/">Storefront</Link>
        <Link className="badge" href="/">Orders</Link>
        <Link className="badge" href="/">Inventory</Link>
      </nav>
    </header>
  );
}
