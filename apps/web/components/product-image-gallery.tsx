"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import type { MediaAsset, ProductVideo } from "@asur/types";

// ── Unified gallery item ─────────────────────────────────────────────────────

type ImageItem = { kind: "image"; asset: MediaAsset };
type VideoItem = { kind: "video"; video: ProductVideo };
export type GalleryItem = ImageItem | VideoItem;

function buildItems(media: MediaAsset[], videos: ProductVideo[] = []): GalleryItem[] {
  // Images first, then videos — preserves existing image ordering
  return [
    ...media.map((asset): ImageItem => ({ kind: "image", asset })),
    ...videos.map((video): VideoItem => ({ kind: "video", video }))
  ];
}

// ── Touch swipe ──────────────────────────────────────────────────────────────

function useTouchSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useCallback((e: React.TouchEvent) => {
    (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX);
  }, []);
  const endX = useCallback((e: React.TouchEvent) => {
    const startVal = Number((e.currentTarget as HTMLElement).dataset.touchX ?? 0);
    const delta = e.changedTouches[0].clientX - startVal;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) onSwipeLeft(); else onSwipeRight();
  }, [onSwipeLeft, onSwipeRight]);
  return { onTouchStart: startX, onTouchEnd: endX };
}

// ── Video player (used in main area and lightbox) ────────────────────────────

function VideoPlayer({ video, autoPlay = false, style }: { video: ProductVideo; autoPlay?: boolean; style?: React.CSSProperties }) {
  return (
    <video
      src={video.url}
      poster={video.poster}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      controls
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
    />
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  title,
  startIndex,
  onClose
}: {
  items: GalleryItem[];
  title: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : items.length - 1)), [items.length]);
  const next = useCallback(() => setIdx((i) => (i < items.length - 1 ? i + 1 : 0)), [items.length]);
  const swipe = useTouchSwipe(next, prev);

  useEffect(() => {
    const prev_ = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i > 0 ? i - 1 : items.length - 1));
      if (e.key === "ArrowRight") setIdx((i) => (i < items.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = prev_; };
  }, [onClose, items.length]);

  const current = items[idx];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${idx + 1} of ${items.length}`}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(0,0,0,0.94)", backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        {...swipe}
        style={{
          position: "relative", width: "min(90vw, 700px)", height: "min(85vh, 875px)",
          borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.7)"
        }}
      >
        {current.kind === "video" ? (
          <VideoPlayer video={current.video} autoPlay style={{ borderRadius: 16 }} />
        ) : (
          <Image
            src={current.asset.url}
            alt={current.asset.alt ?? title}
            fill
            sizes="(max-width: 640px) 90vw, 700px"
            style={{ objectFit: "contain" }}
            priority
          />
        )}

        <button onClick={onClose} aria-label="Close lightbox" style={{
          position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%",
          background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", zIndex: 2
        }}>✕</button>

        {items.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", zIndex: 2 }}>‹</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", zIndex: 2 }}>›</button>
          </>
        )}
      </div>

      {/* Counter + strip */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>
          {idx + 1} / {items.length}
        </span>
        {items.length > 1 && (
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Go to ${item.kind === "video" ? "video" : "image"} ${i + 1}`} style={{
                width: 48, height: 56, borderRadius: 8, padding: 0,
                border: `2px solid ${i === idx ? "#f97316" : "rgba(255,255,255,0.2)"}`,
                background: "rgba(0,0,0,0.4)", cursor: "pointer", overflow: "hidden",
                position: "relative", flexShrink: 0, transition: "border-color 0.15s"
              }}>
                {item.kind === "video" ? (
                  <>
                    {item.video.poster
                      ? <Image src={item.video.poster} alt={item.video.label ?? "Video"} fill sizes="48px" style={{ objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)" }} />}
                    <VideoPlayIcon />
                  </>
                ) : (
                  <Image src={item.asset.url} alt={item.asset.alt ?? `View ${i + 1}`} fill sizes="48px" style={{ objectFit: "cover" }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <p style={{ marginTop: "0.6rem", fontSize: "0.73rem", color: "rgba(255,255,255,0.3)" }}>
        Press Esc to close · Arrow keys to navigate
      </p>
    </div>
  );
}

// ── Play icon overlay ─────────────────────────────────────────────────────────

function VideoPlayIcon() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.35)"
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8.5" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <polygon points="7,5.5 14,9 7,12.5" fill="white" />
      </svg>
    </div>
  );
}

// ── Main gallery ──────────────────────────────────────────────────────────────

type Props = {
  media: MediaAsset[];
  videos?: ProductVideo[];
  title: string;
};

export function ProductImageGallery({ media, videos, title }: Props) {
  const items = buildItems(media, videos);
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const prev = useCallback(() => setSelected((i) => (i > 0 ? i - 1 : items.length - 1)), [items.length]);
  const next = useCallback(() => setSelected((i) => (i < items.length - 1 ? i + 1 : 0)), [items.length]);
  const swipe = useTouchSwipe(next, prev);

  if (items.length === 0) {
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

  const current = items[selected];

  return (
    <>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {/* ── Main area ── */}
        <div
          role="region"
          aria-label="Product media"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if ((e.key === "Enter" || e.key === " ") && current.kind === "image") setLightboxOpen(true);
          }}
          {...swipe}
          style={{
            aspectRatio: "4 / 5", borderRadius: 24,
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            position: "relative", overflow: "hidden", outline: "none"
          }}
        >
          {current.kind === "video" ? (
            <video
              ref={videoRef}
              key={current.video.url} // remount when switching videos
              src={current.video.url}
              poster={current.video.poster}
              autoPlay
              muted
              loop
              playsInline
              controls
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 24 }}
            />
          ) : (
            <>
              <Image
                src={current.asset.url}
                alt={current.asset.alt ?? title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                style={{ objectFit: "cover", borderRadius: 24, cursor: "zoom-in" }}
                priority={selected === 0}
                onClick={() => setLightboxOpen(true)}
              />
              {/* Zoom hint */}
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
            </>
          )}

          {/* Prev / Next arrows — shown when multiple items */}
          {items.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", zIndex: 2 }}>‹</button>
              <button onClick={next} aria-label="Next" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", zIndex: 2 }}>›</button>
              {/* Dot indicator */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                {items.map((_, i) => (
                  <button key={i} onClick={() => setSelected(i)} aria-label={`Go to item ${i + 1}`} style={{ width: i === selected ? 20 : 6, height: 6, borderRadius: 3, background: i === selected ? "#f97316" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s, background 0.2s" }} />
                ))}
              </div>
            </>
          )}

          {/* Video label badge */}
          {current.kind === "video" && current.video.label && (
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "rgba(0,0,0,0.55)", borderRadius: 999,
              padding: "0.2rem 0.6rem", fontSize: "0.68rem", color: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: "0.3rem"
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <polygon points="2,1 9,5 2,9" fill="currentColor" />
              </svg>
              {current.video.label}
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {items.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-label={`View ${item.kind === "video" ? "video" : "image"} ${i + 1}`}
                aria-pressed={i === selected}
                style={{
                  padding: 0,
                  border: `2px solid ${i === selected ? "#f97316" : "var(--border)"}`,
                  borderRadius: 12, background: "rgba(255,255,255,0.04)",
                  cursor: "pointer", flexShrink: 0, width: 72, height: 90,
                  position: "relative", overflow: "hidden", transition: "border-color 0.15s"
                }}
              >
                {item.kind === "video" ? (
                  <>
                    {item.video.poster
                      ? <Image src={item.video.poster} alt={item.video.label ?? "Video"} fill sizes="72px" style={{ objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)" }} />}
                    <VideoPlayIcon />
                  </>
                ) : (
                  <Image src={item.asset.url} alt={item.asset.alt ?? `${title} view ${i + 1}`} fill sizes="72px" style={{ objectFit: "cover" }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          items={items}
          title={title}
          startIndex={selected}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
