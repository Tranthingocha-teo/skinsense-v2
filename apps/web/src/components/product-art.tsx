import { initialsOf, productShape, type ProductShape } from "@skinsense/domain";
import { cn } from "cn";
import { artworkTint } from "./artwork-tint";

// The app's own drawing of a product that has no uploaded photo: a packaging silhouette read
// from the category (tube, pump, jar, dropper, bottle) with the brand's initials on the label.
// Authored here, so the shop never shows a stock or hotlinked photo as if it were the product.

type Box = { x: number; y: number; w: number; h: number };

const SHAPES: Record<ProductShape, { parts: React.ReactNode; label: Box }> = {
  bottle: {
    parts: (
      <>
        <rect x="41" y="11" width="18" height="10" rx="2" />
        <rect x="44" y="20" width="12" height="10" />
        <rect x="33" y="29" width="34" height="58" rx="9" />
      </>
    ),
    label: { x: 37, y: 46, w: 26, h: 24 },
  },
  pump: {
    parts: (
      <>
        <rect x="39" y="13" width="20" height="5" rx="2" />
        <rect x="57" y="14" width="11" height="3" rx="1.5" />
        <rect x="47.5" y="17" width="5" height="11" />
        <rect x="42" y="27" width="16" height="9" rx="2" />
        <rect x="31" y="35" width="38" height="52" rx="8" />
      </>
    ),
    label: { x: 36, y: 50, w: 28, h: 24 },
  },
  dropper: {
    parts: (
      <>
        <rect x="44" y="11" width="12" height="22" rx="6" />
        <rect x="40" y="32" width="20" height="10" rx="2" />
        <rect x="35" y="41" width="30" height="46" rx="7" />
      </>
    ),
    label: { x: 39, y: 53, w: 22, h: 22 },
  },
  jar: {
    parts: (
      <>
        <rect x="23" y="38" width="54" height="13" rx="3" />
        <rect x="25" y="50" width="50" height="36" rx="8" />
      </>
    ),
    label: { x: 33, y: 57, w: 34, h: 22 },
  },
  tube: {
    parts: (
      <>
        <rect x="28" y="10" width="44" height="6" rx="1.5" />
        <path d="M30 15 H70 L63 73 H37 Z" />
        <rect x="40" y="72" width="20" height="15" rx="2.5" />
      </>
    ),
    label: { x: 37, y: 30, w: 26, h: 26 },
  },
};

export interface ProductArtProps {
  /** Product name: picks the shape when the category does not, and seeds the tint. */
  name: string;
  brand?: string;
  category?: string;
  /** Stable id for the tint; defaults to the name. */
  seed?: string;
  className?: string;
  /** Accessible name; decorative (aria-hidden) when omitted. */
  label?: string;
}

export function ProductArt({ name, brand, category, seed, className, label }: ProductArtProps) {
  const shape = SHAPES[productShape(category, name)];
  const tint = artworkTint(seed ?? brand ?? name);
  const initials = initialsOf(brand || name);
  const { x, y, w, h } = shape.label;
  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      data-slot="product-art"
      className={cn("flex items-center justify-center overflow-hidden select-none", className)}
      style={{ background: tint.bg }}
    >
      <svg viewBox="0 0 100 100" className="size-[86%] max-h-full" aria-hidden focusable="false">
        <ellipse cx="50" cy="89" rx="24" ry="2.4" fill="var(--foreground)" opacity="0.08" />
        <g fill={tint.ink} stroke="var(--foreground)" strokeOpacity="0.28" strokeWidth="0.8" strokeLinejoin="round">
          {shape.parts}
        </g>
        <rect x={x} y={y} width={w} height={h} rx="2" fill="var(--card)" opacity="0.92" />
        <text
          x={x + w / 2}
          y={y + h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--foreground)"
          fontSize={initials.length > 1 ? 10 : 12}
          className="font-display"
          style={{ letterSpacing: "0.04em" }}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
