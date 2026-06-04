"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCompareStore } from "../store/compare-store";

export function CompareBar() {
  const { items, remove, clear } = useCompareStore();
  const router = useRouter();

  if (items.length === 0) return null;

  function handleCompare() {
    const slugs = items.map((p) => p.slug).join(",");
    router.push(`/compare?slugs=${slugs}`);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 8500,
        display: "flex",
        justifyContent: "center",
        padding: "0 0.75rem 0.75rem",
        pointerEvents: "none"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
        background: "rgba(18,14,10,0.96)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(249,115,22,0.2)",
        borderRadius: 16,
        padding: "0.85rem 1.1rem",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
        pointerEvents: "auto",
        maxWidth: 640,
        width: "100%"
      }}>
        {/* Thumbnails */}
        <div style={{ display: "flex", gap: "0.4rem", flex: 1, minWidth: 0 }}>
          {items.map((p) => (
            <div key={p.slug} style={{ position: "relative" }}>
              <div style={{ width: 44, height: 52, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(249,115,22,0.3)", position: "relative", flexShrink: 0 }}>
                {p.media?.[0]?.url ? (
                  <Image src={p.media[0].url} alt={p.title} fill sizes="44px" style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--accent)", fontWeight: 700 }}>
                    {p.title.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Remove X */}
              <button
                onClick={() => remove(p.slug)}
                aria-label={`Remove ${p.title} from comparison`}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#ef4444", border: "none", color: "#fff",
                  cursor: "pointer", fontSize: "0.6rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1
                }}
              >✕</button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: 44, height: 52, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.15)" }}>+</span>
            </div>
          ))}
        </div>

        {/* Label */}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600 }}>
            {items.length} of 3 selected
          </p>
          {items.length < 2 && (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>Add 1 more to compare</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <button
            onClick={clear}
            style={{ padding: "0.5rem 0.85rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Clear
          </button>
          <button
            onClick={handleCompare}
            disabled={items.length < 2}
            style={{
              padding: "0.5rem 1rem", borderRadius: 999, border: "none", fontSize: "0.85rem", fontWeight: 700,
              background: items.length >= 2 ? "linear-gradient(135deg, #f97316, #fb7185)" : "rgba(255,255,255,0.08)",
              color: items.length >= 2 ? "#130f0b" : "var(--text-muted)",
              cursor: items.length >= 2 ? "pointer" : "not-allowed"
            }}
          >
            Compare →
          </button>
        </div>
      </div>
    </div>
  );
}
