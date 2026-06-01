"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@asur/types";
import { useAuthStore } from "../store/auth-store";
import { useWishlistStore, productToWishlistItem } from "../store/wishlist-store";
import { api } from "../lib/api";

type Props = {
  product: Product;
  size?: number;
  className?: string;
};

export function HeartButton({ product, size = 20, className }: Props) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { add, remove, isWishlisted, setPendingProductId } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    if (!session) {
      // Store the intent and redirect to sign-in
      setPendingProductId(product.id);
      router.push(`/auth?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setBusy(true);
    if (wishlisted) {
      remove(product.id); // optimistic
      try {
        await api.del(`/api/v1/wishlist/${product.id}`);
      } catch {
        add(productToWishlistItem(product)); // roll back
      }
    } else {
      add(productToWishlistItem(product)); // optimistic
      try {
        await api.post("/api/v1/wishlist", { productId: product.id });
      } catch {
        remove(product.id); // roll back
      }
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      disabled={busy}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        border: wishlisted
          ? "1px solid rgba(251,113,133,0.5)"
          : "1px solid rgba(255,255,255,0.15)",
        borderRadius: "50%",
        width: size + 16,
        height: size + 16,
        cursor: busy ? "wait" : "pointer",
        transition: "transform 160ms ease, border-color 160ms ease",
        flexShrink: 0
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={wishlisted ? "#fb7185" : "none"}
        stroke={wishlisted ? "#fb7185" : "rgba(255,255,255,0.8)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transition: "fill 200ms ease, stroke 200ms ease" }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
