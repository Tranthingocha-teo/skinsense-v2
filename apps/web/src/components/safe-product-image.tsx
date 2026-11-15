"use client";

import { useState } from "react";
import { Sparkles, ImageOff } from "lucide-react";

interface SafeProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function SafeProductImage({
  src,
  alt,
  className = "size-14 sm:size-16 rounded-lg object-cover border border-border shrink-0",
  containerClassName,
}: SafeProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={
          containerClassName ||
          `${className} flex items-center justify-center bg-muted/30 text-muted-foreground/60 border border-border/80 select-none`
        }
      >
        <div className="flex flex-col items-center justify-center gap-1 text-[10px]">
          <Sparkles className="size-4 opacity-50" />
          <span className="sr-only">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
