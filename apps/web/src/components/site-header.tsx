import Link from "next/link";
import type { ReactNode } from "react";

// Canvas MARK snippet (design-2/build.mjs): two rings and a dot, static.
// `draw` = MARKDRAW: the rings draw once per load (CSS in globals.css, DESIGN.md timing).
export function LogoMark({ className, draw }: { className?: string; draw?: boolean }) {
  const ring = draw ? "mark-draw" : undefined;
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <circle cx="28" cy="32" r="18" stroke="currentColor" strokeWidth="1.6" className={ring} />
      <circle cx="36" cy="32" r="18" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.6" className={ring} />
      <circle cx="32" cy="14.45" r="2.2" fill="currentColor" className={draw ? "mark-draw-dot" : undefined} />
    </svg>
  );
}

// Canvas ICONS used by the public pages (stroke 1.5, round caps).
const ICONS = {
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  check: <path d="M5 13l4 4L19 7" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  google: <path d="M20 12a8 8 0 1 1-2.34-5.66M20 12h-7" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
};

export function CanvasIcon({ name, size }: { name: keyof typeof ICONS; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {ICONS[name]}
    </svg>
  );
}

// WebCaseStudy / WebPrivacy / WebNotFound header: mark + wordmark, 96px at desktop, 72px at 390.
// WebLanding adds a centred `nav` (three equal columns at md) and draws the mark.
export function SiteHeader({ nav, drawMark, children }: { nav?: ReactNode; drawMark?: boolean; children?: ReactNode }) {
  return (
    <header
      className={`relative flex h-[72px] items-center justify-between pr-3 pl-5 md:h-24 md:px-14 ${nav ? "md:grid md:grid-cols-3" : ""}`}
    >
      <Link href="/" className="flex items-center gap-2.5 md:gap-3">
        <LogoMark className="size-[26px] md:size-[30px]" draw={drawMark} />
        <span className="font-display text-[15px] tracking-[0.2em] md:text-xl">SKINSENSE</span>
      </Link>
      {nav}
      {children}
    </header>
  );
}
