import type { MediaAsset } from "@asur/types";

type Props = {
  media: MediaAsset[];
  title: string;
};

export function ProductImageGallery({ media, title }: Props) {
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
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            fontSize: "0.78rem",
          }}
        >
          {title}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {/* Main image */}
      <div
        style={{
          aspectRatio: "4 / 5",
          borderRadius: 24,
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media[0].url}
          alt={media[0].alt ?? title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
          {media.slice(1).map((asset, i) => (
            <div
              key={i}
              style={{
                width: 72,
                height: 90,
                flexShrink: 0,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.alt ?? `${title} view ${i + 2}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
