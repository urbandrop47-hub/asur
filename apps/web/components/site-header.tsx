import Link from "next/link";
import { APP_NAME } from "@asur/constants";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/collections", label: "Collections" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/auth", label: "Auth" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>
            <strong>{APP_NAME}</strong>
            <span>Premium fashion commerce</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
