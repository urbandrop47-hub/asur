"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { MediaAsset } from "@asur/types";

type Props = {
  media: MediaAsset[];
  title: string;
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
function useTouchSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useCallback((e: React.TouchEvent) => {
    (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX);
  }, []);

  const endX = useCallback((e: React.TouchEvent) => {
    const startVal = Number((e.currentTarget as HTMLElement).dataset.touchX ?? 0);
    const delta = e.changedTouches[0].clientX - startVal;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) onSwipeLeft();
    else onSwipeRight();
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart: startX, onTouchEnd: endX };
}

function Lightbox({
  media,
  title,
  startIndex,
  onClose
}: {
  media: MediaAsset[];
  title: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : media.length - 1)), [media.length]);
  const next = useCallback(() => setIdx((i) => (i < media.length - 1 ? i + 1 : 0)), [media.length]);
  const swipe = useTouchSwipe(next, prev);

  // Keyboard + scroll lock
  useEffect(() => {
    const prev_ = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i > 0 ? i - 1 : media.length - 1));
      if (e.key === "ArrowRight") setIdx((i) => (i < media.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev_;
    };
  }, [onClose, media.length]);

  const current = media[idx];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — image ${idx + 1} of ${media.length}`}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}
      onClick={onClose}
    >
      {/* Image container — stops click propagation; swipe left/right on touch */}
      <div
        onClick={(e) => e.stopPropagation()}
        {...swipe}
        style={{
          position: "relative",
          width: "min(90vw, 700px)",
          height: "min(85vh, 875px)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)"
        }}
      >
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          sizes="(max-width: 640px) 90vw, 700px"
          style={{ objectFit: "contain" }}
          priority
        />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close lightbox"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", zIndex: 2
          }}
        >
          ✕
        </button>

        {/* Prev / Next */}
        {media.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous image" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", zIndex: 2 }}>‹</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next image" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", zIndex: 2 }}>›</button>
          </>
        )}
      </div>

      {/* Counter + thumbnails */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>
          {idx + 1} / {media.length}
        </span>
        {media.length > 1 && (
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {media.map((asset, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                style={{
                  width: 48, height: 56, borderRadius: 8, padding: 0,
                  border: `2px solid ${i === idx ? "#f97316" : "rgba(255,255,255,0.2)"}`,
                  background: "transparent", cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "border-color 0.15s"
                }}
              >
                <Image src={asset.url} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      <p style={{ marginTop: "0.6rem", fontSize: "0.73rem", color: "rgba(255,255,255,0.3)" }}>
        Press Esc to close · Arrow keys to navigate
      </p>
    </div>
  );
}

// ── Main gallery ──────────────────────────────────────────────────────────────
export function ProductImageGallery({ media, title }: Props) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = useCallback(() => setSelected((i) => (i > 0 ? i - 1 : media.length - 1)), [media.length]);
  const next = useCallback(() => setSelected((i) => (i < media.length - 1 ? i + 1 : 0)), [media.length]);
  const swipe = useTouchSwipe(next, prev);

  if (media.length === 0) {
    return (
      <div style={{
        aspectRatio: "4 / 5", borderRadius: 24, overflow: "hidden",
        background: "radial-gradient(circle at top left, rgba(251,113,133,0.45), transparent 42%), radial-gradient(circle at bottom right, rgba(56,189,248,0.35), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.95), rgba(2,6,23,0.85))",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.25em", fontSize: "0.78rem" }}>{title}</span>
      </div>
    );
  }

  const current = media[selected];

  return (
    <>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {/* Main image */}
        <div
          role="region"
          aria-label="Product images"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key === "Enter" || e.key === " ") setLightboxOpen(true);
          }}
          {...swipe}
          style={{ aspectRatio: "4 / 5", borderRadius: 24, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", position: "relative", outline: "none" }}
        >
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
            style={{ objectFit: "cover", borderRadius: 24, cursor: "zoom-in" }}
            priority={selected === 0}
            onClick={() => setLightboxOpen(true)}
          />

          {/* Zoom hint badge */}
          <div style={{
            position: "absolute", bottom: 12, right: 12,
            background: "rgba(0,0,0,0.5)", borderRadius: 999,
            padding: "0.2rem 0.55rem", fontSize: "0.68rem", color: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center", gap: "0.3rem",
            pointerEvents: "none", backdropFilter: "blur(4px)"
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 3v4M3 5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Tap to zoom
          </div>

          {media.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous image" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", zIndex: 2 }}>‹</button>
              <button onClick={next} aria-label="Next image" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", zIndex: 2 }}>›</button>
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                {media.map((_, i) => (
                  <button key={i} onClick={() => setSelected(i)} aria-label={`Go to image ${i + 1}`} style={{ width: i === selected ? 20 : 6, height: 6, borderRadius: 3, background: i === selected ? "#f97316" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s, background 0.2s" }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {media.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
            {media.map((asset, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === selected}
                style={{
                  padding: 0, border: `2px solid ${i === selected ? "#f97316" : "var(--border)"}`,
                  borderRadius: 12, background: "rgba(255,255,255,0.04)",
                  cursor: "pointer", flexShrink: 0, width: 72, height: 90,
                  position: "relative", overflow: "hidden", transition: "border-color 0.15s"
                }}
              >
                <Image src={asset.url} alt={asset.alt ?? `${title} view ${i + 1}`} fill sizes="72px" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox portal */}
      {lightboxOpen && (
        <Lightbox
          media={media}
          title={title}
          startIndex={selected}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
