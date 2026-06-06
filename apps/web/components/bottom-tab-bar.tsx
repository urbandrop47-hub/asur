"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "../store/cart-store";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H6a1 1 0 01-1-1V9.5z"
          stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinejoin="round"
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}
        />
        <path d="M8 20v-7h6v7" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/products",
    label: "Shop",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
        <path d="M8 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 4h2l3 10h9l2-7H6" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="17" r="1.5" fill="currentColor" />
        <circle cx="15" cy="17" r="1.5" fill="currentColor" />
      </svg>
    ),
    badge: true,
  },
  {
    href: "/account",
    label: "Account",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M3 19c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <nav className="btab-bar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`btab-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="btab-icon" style={{ position: "relative" }}>
              {tab.icon(active)}
              {tab.badge && cartCount > 0 && (
                <span className="btab-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span className="btab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
