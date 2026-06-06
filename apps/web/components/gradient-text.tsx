import type { CSSProperties, ElementType, ReactNode } from "react";

type Variant = "fire" | "sky" | "gold";

const CLASS: Record<Variant, string> = {
  fire: "gradient-text-fire",
  sky:  "gradient-text-sky",
  gold: "gradient-text-gold",
};

interface GradientTextProps {
  variant?: Variant;
  as?: ElementType;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * Renders children with an animated gradient shimmer.
 * Zero JS — pure CSS via globals.css `.gradient-text-*` classes.
 *
 * @example
 * <GradientText variant="fire" as="span">DIVINE</GradientText>
 */
export function GradientText({
  variant = "fire",
  as: Tag = "span",
  children,
  style,
  className,
}: GradientTextProps) {
  const props = {
    className: [CLASS[variant], className].filter(Boolean).join(" "),
    style,
    children,
  };
  // Use createElement to keep TypeScript happy with dynamic tags
  const { createElement } = require("react");
  return createElement(Tag, props);
}
