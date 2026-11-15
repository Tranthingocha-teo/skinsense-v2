"use client";

import { ownImageUrl } from "@skinsense/domain";
import { useState } from "react";
import { ProductArt } from "./product-art";

interface SafeProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Classes for the drawn fallback; defaults to className. */
  containerClassName?: string;
  /** Product name for the drawing; defaults to alt. */
  name?: string;
  brand?: string;
  category?: string;
  seed?: string;
}

/**
 * A product's own uploaded photo, or the app's drawing of it (ProductArt) when there is none,
 * the URL is a stock/placeholder host (legacy seed rows), or the image fails to load.
 */
export function SafeProductImage({
  src,
  alt,
  className = "size-14 sm:size-16 rounded-lg object-cover border border-border shrink-0",
  containerClassName,
  name,
  brand,
  category,
  seed,
}: SafeProductImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = ownImageUrl(src);

  if (!url || failed === url) {
    return (
      <ProductArt
        name={name ?? alt}
        brand={brand}
        category={category}
        seed={seed}
        label={alt}
        className={containerClassName || className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} onError={() => setFailed(url)} loading="lazy" />
  );
}
