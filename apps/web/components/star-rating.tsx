interface StarRatingProps {
  rating: number;       // 0–5, supports decimals
  max?: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}

export function StarRating({ rating, max = 5, size = 16, showValue, count }: StarRatingProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        const pct = Math.round(fill * 100);
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={`sf-${i}-${pct}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset={`${pct}%`} stopColor="#f97316" />
                <stop offset={`${pct}%`} stopColor="rgba(255,255,255,0.12)" />
              </linearGradient>
            </defs>
            <path
              d="M8 1.5l1.9 3.8 4.2.6-3 3 .7 4.2L8 11l-3.8 2.1.7-4.2-3-3 4.2-.6z"
              fill={`url(#sf-${i}-${pct})`}
              stroke="rgba(249,115,22,0.3)"
              strokeWidth="0.5"
            />
          </svg>
        );
      })}
      {showValue && (
        <span style={{ fontSize: size * 0.85, color: "var(--text-muted)", fontWeight: 600, marginLeft: 2 }}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span style={{ fontSize: size * 0.8, color: "var(--text-muted)" }}>
          ({count})
        </span>
      )}
    </span>
  );
}

interface InteractiveStarsProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

export function InteractiveStars({ value, onChange, size = 28 }: InteractiveStarsProps) {
  return (
    <span style={{ display: "inline-flex", gap: 4, cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5l1.9 3.8 4.2.6-3 3 .7 4.2L8 11l-3.8 2.1.7-4.2-3-3 4.2-.6z"
              fill={star <= value ? "#f97316" : "rgba(255,255,255,0.1)"}
              stroke={star <= value ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.12)"}
              strokeWidth="0.5"
              style={{ transition: "fill 120ms ease" }}
            />
          </svg>
        </button>
      ))}
    </span>
  );
}
