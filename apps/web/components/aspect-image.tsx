import Image from "next/image";
import type { CSSProperties } from "react";

interface AspectImageProps {
  src?: string;
  alt: string;
  ratio?: string;              // e.g. "4/5", "16/9", "1/1"
  sizes?: string;
  placeholder?: string;        // text shown when no image (e.g. product initials)
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  fill?: boolean;
  rounded?: string;            // border-radius value, e.g. "16px"
}

/**
 * Aspect-ratio-enforced image container with a branded placeholder
 * when no `src` is provided. Wraps next/image in a positioned div.
 *
 * @example
 * <AspectImage src={media[0].url} alt={title} ratio="4/5" placeholder="AS" />
 */
export function AspectImage({
  src,
  alt,
  ratio = "4/5",
  sizes = "(max-width: 640px) 100vw, 480px",
  placeholder,
  className,
  style,
  priority = false,
  rounded = "0px",
}: AspectImageProps) {
  return (
    <div
      className={["aspect-image-wrap", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: ratio, borderRadius: rounded, ...style }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: "cover", borderRadius: rounded }}
        />
      ) : (
        <div className="aspect-image-placeholder" aria-hidden="true">
          {placeholder ?? alt.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
