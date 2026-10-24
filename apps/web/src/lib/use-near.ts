"use client";

import { type RefObject, useEffect, useState } from "react";

// True once the element comes within rootMargin of the viewport (clipping ancestors count); stays true.
export function useNear(ref: RefObject<HTMLElement | null>, rootMargin: string) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!ref.current || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return near;
}
