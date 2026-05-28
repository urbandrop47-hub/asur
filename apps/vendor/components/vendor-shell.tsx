import Link from "next/link";
import { APP_NAME } from "@asur/constants";

export function VendorShell() {
  return (
    <header className="vendor-header">
      <div className="brand">
        <span className="brand-mark" />
        <span>
          <strong style={{ display: "block", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.8rem" }}>ASUR Vendor</strong>
          <span style={{ color: "var(--text-muted)" }}>{APP_NAME} fulfillment workspace</span>
        </span>
      </div>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="badge" href="/">Tasks</Link>
        <Link className="badge" href="/">Tracking</Link>
        <Link className="badge" href="/">Shipments</Link>
      </nav>
    </header>
  );
}
