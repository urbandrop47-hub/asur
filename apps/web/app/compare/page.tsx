"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";
import { useCompareStore } from "../../store/compare-store";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clear } = useCompareStore();
  const slugsParam = searchParams.get("slugs") ?? "";
  const slugs = slugsParam.split(",").filter(Boolean).slice(0, 3);

  const [products, setProducts] = useState<(Product | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return; }
    Promise.all(
      slugs.map((slug) =>
        api.get<{ data: Product }>(`/api/v1/products/${slug}`).then((r) => r.data).catch(() => null)
      )
    ).then((results) => setProducts(results)).finally(() => setLoading(false));
  }, [slugsParam]); // eslint-disable-line react-hooks/exhaustive-deps

  if (slugs.length < 2) {
    return (
      <div style={{ maxWidth: 520, margin: "6rem auto", textAlign: "center", padding: "0 1rem" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📊</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>Nothing to compare</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Select 2–3 products using the "Compare" button on any product card, then click "Compare →".
        </p>
        <Link href="/products" style={{ display: "inline-flex", alignItems: "center", padding: "0.85rem 2rem", borderRadius: 999, background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", fontWeight: 700, textDecoration: "none" }}>
          Browse products
        </Link>
      </div>
    );
  }

  const validProducts = products.filter(Boolean) as Product[];

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "3rem auto", padding: "0 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${slugs.length}, 1fr)`, gap: "1rem" }}>
          {Array.from({ length: (slugs.length + 1) * 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  const rows: { label: string; getValue: (p: Product) => React.ReactNode }[] = [
    {
      label: "Image",
      getValue: (p) => (
        <Link href={`/products/${p.slug}`} style={{ display: "block" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
            {p.media?.[0]?.url ? (
              <Image src={p.media[0].url} alt={p.title} fill sizes="200px" style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>{p.title.slice(0, 2)}</span>
              </div>
            )}
          </div>
        </Link>
      )
    },
    {
      label: "Name",
      getValue: (p) => (
        <Link href={`/products/${p.slug}`} style={{ fontWeight: 700, color: "var(--text)", textDecoration: "none", fontSize: "0.92rem", lineHeight: 1.3, display: "block" }}>
          {p.title}
        </Link>
      )
    },
    {
      label: "Price",
      getValue: (p) => (
        <strong style={{ fontSize: "1.05rem", color: "var(--accent)" }}>
          {p.variants.length > 1 ? "from " : ""}{formatCurrency(Math.min(...p.variants.map((v) => v.price)))}
        </strong>
      )
    },
    {
      label: "Category",
      getValue: (p) => <span style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>{p.category}</span>
    },
    {
      label: "Fit",
      getValue: (p) => p.fit
        ? <span style={{ padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.78rem", fontWeight: 600, textTransform: "capitalize" }}>{p.fit}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>—</span>
    },
    {
      label: "Sizes",
      getValue: (p) => {
        const sizes = [...new Set(p.variants.map((v) => v.size))];
        return <span style={{ fontSize: "0.83rem" }}>{sizes.join(", ")}</span>;
      }
    },
    {
      label: "Colours",
      getValue: (p) => {
        const colors = [...new Set(p.variants.map((v) => v.color))];
        return <span style={{ fontSize: "0.83rem" }}>{colors.join(", ")}</span>;
      }
    },
    {
      label: "Availability",
      getValue: (p) => {
        const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
        return totalStock === 0
          ? <span style={{ color: "var(--danger)", fontSize: "0.83rem", fontWeight: 600 }}>Sold out</span>
          : totalStock < 5
            ? <span style={{ color: "var(--warning)", fontSize: "0.83rem", fontWeight: 600 }}>Low stock ({totalStock})</span>
            : <span style={{ color: "var(--success)", fontSize: "0.83rem", fontWeight: 600 }}>In stock</span>;
      }
    },
    {
      label: "Tags",
      getValue: (p) => p.tags.length > 0
        ? <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{p.tags.slice(0, 4).join(", ")}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>
    }
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1rem 5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.2rem", fontSize: "1.5rem", fontWeight: 800 }}>Compare</h1>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>Comparing {validProducts.length} products</p>
        </div>
        <button
          onClick={() => { clear(); router.push("/products"); }}
          style={{ padding: "0.5rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.83rem", cursor: "pointer" }}
        >
          Clear & browse
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${validProducts.length}, 1fr)`, gap: "1rem", minWidth: 480 }}>
          {rows.map((row) => (
            <>
              {/* Label cell */}
              <div key={`label-${row.label}`} style={{ display: "flex", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {row.label}
              </div>
              {/* Value cells */}
              {validProducts.map((p) => (
                <div key={`${row.label}-${p.id}`} style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center" }}>
                  {row.getValue(p)}
                </div>
              ))}
              {/* Placeholder for missing products */}
              {Array.from({ length: slugs.length - validProducts.length }).map((_, i) => (
                <div key={`missing-${row.label}-${i}`} style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }} />
              ))}
            </>
          ))}
          {/* Shop CTA row */}
          <div style={{ padding: "1rem 0", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center" }}>
            Shop
          </div>
          {validProducts.map((p) => {
            const inStock = p.variants.some((v) => v.stock > 0);
            return (
              <div key={`shop-${p.id}`} style={{ padding: "1rem 0.5rem", display: "flex", alignItems: "center" }}>
                <Link
                  href={`/products/${p.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0.65rem 1.1rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem",
                    background: inStock ? "linear-gradient(135deg, #f97316, #fb7185)" : "rgba(255,255,255,0.07)",
                    color: inStock ? "#130f0b" : "var(--text-muted)",
                    textDecoration: "none", pointerEvents: inStock ? "auto" : "none"
                  }}
                >
                  {inStock ? "Shop now →" : "Sold out"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading comparison…</div>}>
      <CompareContent />
    </Suspense>
  );
}
