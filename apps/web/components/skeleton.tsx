import type { CSSProperties } from "react";

type Props = {
  height?: number | string;
  width?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
};

export function Skeleton({ height, width, borderRadius, style }: Props) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton skeleton-line" style={{ height: 44, borderRadius: 999, marginTop: 4 }} />
      </div>
    </div>
  );
}
