import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ margin: "0 0 0.3rem", fontSize: "1.5rem", fontWeight: 800 }}>Dashboard</h1>
      <p style={{ margin: "0 0 2rem", color: "var(--text-muted)" }}>ASUR operations overview</p>

      <div className="grid-2">
        <Link href="/products" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer", transition: "border-color 0.15s" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>◈</p>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1rem" }}>Products</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Manage catalog — create, edit, and publish products
            </p>
          </div>
        </Link>
        <Link href="/orders" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer", transition: "border-color 0.15s" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>◫</p>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1rem" }}>Orders</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Monitor all customer orders and fulfillment status
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
