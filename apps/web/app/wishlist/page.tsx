"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../store/auth-store";
import { useWishlistStore, productToWishlistItem } from "../../store/wishlist-store";
import { useCartStore } from "../../store/cart-store";
import { HeartButton } from "../../components/heart-button";
import { api } from "../../lib/api";

type WishlistEntry = { productId: string; addedAt: string; product: Product };

export default function WishlistPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { setAll, pendingProductId, setPendingProductId } = useWishlistStore();
  // Subscribe to the store's item list so removals via HeartButton are reflected immediately
  const storeItems = useWishlistStore((s) => s.items);
  const addCartItem = useCartStore((s) => s.addItem);

  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the rendered grid in sync when HeartButton removes items from the Zustand store
  useEffect(() => {
    if (entries.length === 0) return;
    const activeIds = new Set(storeItems.map((i) => i.productId));
    setEntries((prev) => prev.filter((e) => activeIds.has(e.productId)));
  }, [storeItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pending wishlist item (added before login) after sign-in
  useEffect(() => {
    if (!session || !pendingProductId) return;
    api
      .post("/api/v1/wishlist", { productId: pendingProductId })
      .catch(() => {})
      .finally(() => setPendingProductId(null));
  }, [session, pendingProductId, setPendingProductId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      // Show local wishlist for unauthenticated users
      setEntries([]); // no product details without auth
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<{ data: { items: WishlistEntry[] } }>("/api/v1/wishlist")
      .then((res) => {
        const fetched = res.data.items;
        setEntries(fetched);
        // Sync Zustand store from backend
        setAll(fetched.map((e) => productToWishlistItem(e.product)));
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load wishlist"))
      .finally(() => setLoading(false));
  }, [session, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  function moveToCart(entry: WishlistEntry) {
    const variant = entry.product.variants.find((v) => v.stock > 0);
    if (!variant) return;
    addCartItem({
      productId: entry.product.id,
      productTitle: entry.product.title,
      productSlug: entry.product.slug,
      imageUrl: entry.product.media?.[0]?.url,
      variantSku: variant.sku,
      unitPrice: variant.price,
      quantity: 1,
      size: variant.size,
      color: variant.color,
      maxStock: variant.stock
    });
    router.push("/cart");
  }

  if (!hydrated || loading) {
    return (
      <div className="stack" style={{ paddingTop: "3rem" }}>
        <div className="skeleton skeleton-line" style={{ height: 48, width: "40%", marginBottom: "2rem" }} />
        <div className="grid-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line-sm" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="stack" style={{ paddingTop: "4rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>♡</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.75rem" }}>Your wishlist</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Sign in to save and view your wishlisted items.
        </p>
        <Link
          href="/auth?redirect=/wishlist"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0.85rem 2rem", borderRadius: 999,
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ paddingTop: "2.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, margin: 0 }}>
          Wishlist
        </h1>
        {entries.length > 0 && (
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {entries.length} item{entries.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error && (
        <div className="error-banner">{error}. Check that the backend is running.</div>
      )}

      {!error && entries.length === 0 && (
        <div className="empty-state" style={{ paddingTop: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>♡</div>
          <p style={{ marginBottom: "1.5rem" }}>
            Nothing saved yet. Tap the heart on any product to save it here.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "0.75rem 1.5rem",
              borderRadius: 999, background: "linear-gradient(135deg, #f97316, #fb7185)",
              color: "#130f0b", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem",
            }}
          >
            Browse products
          </Link>
        </div>
      )}

      {entries.length > 0 && (
        <div className="grid-3">
          {entries.map((entry, i) => {
            const { product } = entry;
            const lowestPrice = product.variants.length > 0
              ? Math.min(...product.variants.map((v) => v.price))
              : 0;
            const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
            const isSoldOut = totalStock === 0;
            const coverImage = product.media?.[0];

            return (
              <article
                key={product.id}
                className="product-card animate-in"
                style={{ display: "flex", flexDirection: "column", animationDelay: `${Math.min(i * 0.06, 0.4)}s` }}
              >
                {/* Image */}
                <div style={{ position: "relative" }}>
                  <Link href={`/products/${product.slug}`} style={{ display: "block", textDecoration: "none" }}>
                    <div
                      className="product-image"
                      style={{ position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0" }}
                    >
                      {coverImage?.url ? (
                        <Image
                          src={coverImage.url}
                          alt={coverImage.alt ?? product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          position: "absolute", inset: 0, display: "flex",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "3rem", color: "rgba(255,255,255,0.12)", textTransform: "uppercase" }}>
                            {product.title.slice(0, 2)}
                          </span>
                        </div>
                      )}
                      {isSoldOut && (
                        <div style={{
                          position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ padding: "0.35rem 0.9rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.22)", fontSize: "0.7rem", fontWeight: 700, color: "rgba(246,241,234,0.7)", backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Sold out
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  {/* Heart positioned over image */}
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}>
                    <HeartButton
                      product={product}
                      size={16}
                    />
                  </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.65rem", padding: "1rem" }}>
                  <div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>
                      {product.category}
                    </span>
                    <h3 style={{ margin: "0.25rem 0 0", fontSize: "1rem", fontWeight: 700, lineHeight: 1.3 }}>
                      {product.title}
                    </h3>
                  </div>

                  <strong style={{ fontSize: "1.05rem" }}>{formatCurrency(lowestPrice)}</strong>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button
                      disabled={isSoldOut}
                      onClick={() => moveToCart(entry)}
                      style={{
                        flex: 1, padding: "0.7rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem",
                        background: isSoldOut ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #f97316, #fb7185)",
                        color: isSoldOut ? "var(--text-muted)" : "#130f0b",
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        border: "none", minHeight: 44,
                      }}
                    >
                      {isSoldOut ? "Sold out" : "Move to cart"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
