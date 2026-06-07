"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { HeartButton } from "./heart-button";
import { getLowestVariantPrice, getTotalStock, hasVariants } from "../lib/product-utils";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const lowestPrice = getLowestVariantPrice(product);
  const lowestCompare = hasVariants(product)
    ? Math.min(...product.variants.map((v) => v.compareAtPrice ?? Infinity))
    : Infinity;
  const hasDiscount = lowestPrice !== null && isFinite(lowestCompare) && lowestCompare > lowestPrice;
  const totalStock = getTotalStock(product);
  const comingSoon = !hasVariants(product);
  const coverImage = product.media?.[0];
  const hoverImage = product.media?.[1]; // used for hover crossfade
  const previewVideo = product.videos?.[0]; // first video used for hover-play preview
  const isSoldOut = !comingSoon && totalStock === 0;
  const isLowStock = !comingSoon && !isSoldOut && totalStock < 5;
  // "New" badge: product was created within the last 14 days
  const isNew = product.createdAt
    ? Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000
    : false;

  return (
    <article className="product-card" style={{ display: "flex", flexDirection: "column" }}>
      {/* ── Image ── */}
      <Link
        href={`/products/${product.slug}`}
        style={{ display: "block", textDecoration: "none", flexShrink: 0 }}
        onMouseEnter={() => { videoRef.current?.play().catch(() => {}); }}
        onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
      >
        <div
          className="product-image"
          style={{ position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0" }}
        >
          {coverImage?.url ? (
            <>
              <Image
                src={coverImage.url}
                alt={coverImage.alt ?? product.title}
                fill
                sizes="(max-width: 640px) 100vw, 360px"
                style={{ objectFit: "cover" }}
                priority={priority}
              />
              {/* Hover crossfade to second image (if no video) */}
              {hoverImage?.url && !previewVideo && (
                <Image
                  src={hoverImage.url}
                  alt={hoverImage.alt ?? `${product.title} — alternate view`}
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                  className="product-image-second"
                  aria-hidden="true"
                />
              )}
              {/* Hover video preview — replaces crossfade when product has a video */}
              {previewVideo && (
                <video
                  ref={videoRef}
                  src={previewVideo.url}
                  poster={previewVideo.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="product-image-second"
                  aria-hidden="true"
                  style={{ objectFit: "cover" }}
                />
              )}
            </>
          ) : (
            /* Placeholder with product initials */
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "0.35rem",
            }}>
              <span style={{
                fontFamily: "var(--f-display)", fontSize: "clamp(2rem, 6vw, 3.5rem)",
                color: "rgba(255,255,255,0.12)", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {product.title.slice(0, 2)}
              </span>
              <span style={{
                fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.28em",
              }}>
                {product.slug.split("-").slice(0, 2).join(" ")}
              </span>
            </div>
          )}

          {/* Sold-out overlay */}
          {isSoldOut && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                padding: "0.35rem 0.9rem", borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "rgba(246,241,234,0.7)",
                backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.35)",
              }}>
                Sold out
              </span>
            </div>
          )}

          {/* Wishlist heart — fades in on card hover (desktop), always visible on touch */}
          <div className="heart-reveal" style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}>
            <HeartButton product={product} size={16} />
          </div>

          {/* New badge */}
          {isNew && !isSoldOut && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              padding: "0.25rem 0.6rem", borderRadius: 999,
              background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#818cf8",
            }}>
              New
            </div>
          )}

          {/* Low-stock badge */}
          {isLowStock && !isSoldOut && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              padding: "0.25rem 0.6rem", borderRadius: 999,
              background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.35)",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--warning)",
            }}>
              {totalStock} left
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && !isSoldOut && (
            <div style={{
              position: "absolute", top: isLowStock ? 36 : isNew ? 36 : 10, right: 10,
              padding: "0.25rem 0.6rem", borderRadius: 999,
              background: "rgba(249,115,22,0.18)", border: "1px solid rgba(249,115,22,0.35)",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--accent)",
            }}>
              Sale
            </div>
          )}
        </div>
      </Link>

      {/* ── Body ── */}
      <div
        className="body"
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.65rem", padding: "1rem" }}
      >
        {/* Category + title */}
        <div>
          <span style={{
            fontFamily: "var(--f-mono)", fontSize: "9px", fontWeight: 600,
            letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)",
          }}>
            {product.category}
          </span>
          <h3 style={{ margin: "0.25rem 0 0", fontSize: "1rem", fontWeight: 700, lineHeight: 1.3 }}>
            {product.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.55, flex: 1 }}>
          {product.description.length > 88
            ? product.description.slice(0, 88) + "…"
            : product.description}
        </p>

        {/* Price row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
            <strong style={{ fontSize: "1.05rem", color: comingSoon ? "var(--text-muted)" : isSoldOut ? "var(--text-muted)" : "var(--text)" }}>
              {comingSoon
                ? "Coming soon"
                : <>
                    {product.variants.length > 1 && !isSoldOut ? "from " : ""}
                    {lowestPrice !== null ? formatCurrency(lowestPrice) : "Price unavailable"}
                  </>
              }
            </strong>
            {hasDiscount && lowestPrice !== null && (
              <s style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 400 }}>
                {formatCurrency(lowestCompare)}
              </s>
            )}
          </div>
          <span style={{
            fontSize: "0.72rem", fontWeight: 600,
            color: comingSoon ? "var(--text-muted)" : isSoldOut ? "var(--danger)" : isLowStock ? "var(--warning)" : "var(--success)",
          }}>
            {comingSoon ? "Coming soon" : isSoldOut ? "Out of stock" : isLowStock ? `${totalStock} left` : "In stock"}
          </span>
        </div>


        {/* CTA */}
        <Link
          href={`/products/${product.slug}`}
          className="pcard-shop-btn"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            borderRadius: 999, padding: "0.75rem 1rem",
            background: comingSoon || isSoldOut
              ? "rgba(255,255,255,0.07)"
              : "linear-gradient(135deg, #f97316, #fb7185)",
            color: comingSoon || isSoldOut ? "var(--text-muted)" : "#130f0b",
            fontWeight: 700, fontSize: "0.88rem", textDecoration: "none",
            minHeight: 44,
            pointerEvents: comingSoon || isSoldOut ? "none" : "auto",
            transition: "opacity 180ms ease, transform 120ms ease",
          }}
          aria-disabled={comingSoon || isSoldOut}
          tabIndex={comingSoon || isSoldOut ? -1 : undefined}
        >
          {comingSoon ? "Coming soon" : isSoldOut ? "Sold out" : (
            <>
              Shop now
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M2.5 6.5h8M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </Link>
      </div>
    </article>
  );
}
