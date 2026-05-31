"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { MediaAsset } from "@asur/types";

type Props = {
  media: MediaAsset[];
  title: string;
};

export function ProductImageGallery({ media, title }: Props) {
  const [selected, setSelected] = useState(0);

  const prev = useCallback(() => setSelected((i) => (i > 0 ? i - 1 : media.length - 1)), [media.length]);
  const next = useCallback(() => setSelected((i) => (i < media.length - 1 ? i + 1 : 0)), [media.length]);

  if (media.length === 0) {
    return (
      <div
        style={{
          aspectRatio: "4 / 5",
          borderRadius: 24,
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, rgba(251, 113, 133, 0.45), transparent 42%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.35), transparent 40%), linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.85))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.25em", fontSize: "0.78rem" }}>
          {title}
        </span>
      </div>
    );
  }

  const current = media[selected];

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {/* Main image with prev/next controls */}
      <div
        className="img-fill-wrap"
        role="region"
        aria-label="Product images"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
        style={{
          aspectRatio: "4 / 5",
          borderRadius: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          position: "relative",
          outline: "none"
        }}
      >
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
          style={{ objectFit: "cover", borderRadius: 24 }}
          priority={selected === 0}
        />

        {/* Arrow buttons — only shown when multiple images */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)", border: "none", color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", zIndex: 2
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)", border: "none", color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", zIndex: 2
              }}
            >
              ›
            </button>
            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  aria-label={`Go to image ${i + 1}`}
                  style={{
                    width: i === selected ? 20 : 6, height: 6, borderRadius: 3,
                    background: i === selected ? "#f97316" : "rgba(255,255,255,0.5)",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "width 0.2s, background 0.2s"
                  }}
                />
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
                position: "relative", overflow: "hidden",
                transition: "border-color 0.15s"
              }}
            >
              <Image
                src={asset.url}
                alt={asset.alt ?? `${title} view ${i + 1}`}
                fill
                sizes="72px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
