"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@asur/types";
import { ProductCard } from "../components/product-card";
import { api } from "../lib/api";

function ProductSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "75%" }} />
        <div className="skeleton skeleton-line" style={{ height: 44, borderRadius: 999, marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Product[] }>("/api/v1/products")
      .then((res) => setProducts(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const collections = [
    ...new Set(products.flatMap((p) => p.collectionSlugs ?? []).filter((s): s is string => typeof s === "string" && s.length > 0)),
  ].slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <span className="hero-eyebrow">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <circle cx="4" cy="4" r="4" fill="currentColor" />
          </svg>
          New drop available
        </span>
        <h1>
          Streetwear
          <br />
          <span className="hero-gradient-text">made different.</span>
        </h1>
        <p>
          Premium T-shirts, hoodies, and cargo pieces designed for drop culture.
          Limited quantities. No restocks.
        </p>
        <div className="hero-actions">
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              padding: "0.9rem 1.8rem",
              background: "linear-gradient(135deg, #f97316, #fb7185)",
              color: "#130f0b",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              minHeight: 48,
            }}
          >
            Shop the drop
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/collections"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              padding: "0.9rem 1.8rem",
              background: "transparent",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.14)",
              minHeight: 48,
            }}
          >
            View collections
          </Link>
        </div>
      </section>

      {/* Collections strip */}
      {collections.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {collections.map((slug) => (
              <Link
                key={slug}
                href="/collections"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.45rem 1rem",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  transition: "border-color 140ms ease",
                }}
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section>
        <div className="section-title">
          <div>
            <h2>Latest drops</h2>
            <p style={{ margin: "0.3rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Fresh pieces. Select your size before they&apos;re gone.
            </p>
          </div>
          <Link href="/products" className="badge">
            All products
          </Link>
        </div>

        <div className="grid-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
        </div>
      </section>

      {/* Value props */}
      <section style={{ marginTop: "3rem" }}>
        <div className="grid-3" style={{ gap: "0.75rem" }}>
          {[
            { icon: "🚚", title: "Free shipping", body: "On orders above ₹1,500. Delivered within 5–7 days." },
            { icon: "🔒", title: "Secure payments", body: "Powered by Razorpay. Cards, UPI, wallets accepted." },
            { icon: "↩️", title: "Easy returns", body: "7-day hassle-free returns for unworn items." },
          ].map((prop) => (
            <div
              key={prop.title}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: "1.25rem",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{prop.icon}</div>
              <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "0.35rem" }}>{prop.title}</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>{prop.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
