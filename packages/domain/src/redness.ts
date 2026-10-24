import { srgbToLab } from "./color";

export type Rgb = { r: number; g: number; b: number };
export type ZoneReading = { redness: number; unevenness: number; pixelCount: number };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mad(values: number[]): number {
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

// docs/research/redness-index.md: self-referenced CIELAB a*, per ADR 0003.
// A zone with no pixels (occluded, cropped out of frame) reads as zero rather
// than NaN — pixelCount: 0 is the signal callers check to skip/hide the zone.
export function computeZoneReading(zonePixels: Rgb[], allSkinPixels: Rgb[]): ZoneReading {
  if (zonePixels.length === 0) return { redness: 0, unevenness: 0, pixelCount: 0 };

  const zoneA = zonePixels.map((p) => srgbToLab(p.r, p.g, p.b).a);
  const referenceA = median(allSkinPixels.map((p) => srgbToLab(p.r, p.g, p.b).a));

  return {
    redness: median(zoneA) - referenceA,
    unevenness: mad(zoneA),
    pixelCount: zonePixels.length,
  };
}
