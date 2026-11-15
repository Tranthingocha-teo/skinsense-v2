import { tintIndex } from "@skinsense/domain";

// Six muted hues for drawn artwork (product illustrations, initials avatars). DESIGN.md has no
// brand hue, so each tint is mixed into the theme's card colour: low chroma, and the text on it
// stays `foreground`, which keeps AA contrast in both themes.
const HUES = [150, 45, 85, 205, 330, 260];

export function artworkTint(seed: string): { bg: string; ink: string; hue: number } {
  const hue = HUES[tintIndex(seed, HUES.length)]!;
  return {
    hue,
    bg: `color-mix(in oklab, var(--card) 74%, oklch(0.66 0.08 ${hue}))`,
    ink: `color-mix(in oklab, var(--card) 40%, oklch(0.6 0.07 ${hue}))`,
  };
}
