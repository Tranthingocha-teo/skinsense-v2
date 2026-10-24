import { boundingBox } from "./geometry";
import { computeZoneReading, type Rgb, type ZoneReading } from "./redness";
import { assignSpotToZone, ZONES, type Landmark, type Zone } from "./zones";

// ADR 0001's wire format: what each platform's capture adapter hands to domain.
// Landmarks are [0,1]-normalised to width/height; skinMask is width*height, 1 = skin.
export type FaceCapture = {
  width: number;
  height: number;
  landmarks: Landmark[];
  skinMask?: Uint8Array;
};

// ponytail: zone analysis and quality signals run on a ≤640px copy of the
// uncompressed frame (the resolution the pipeline was benchmarked at). Shared
// so mpbench measures at the same size the app does; raise if fixtures show it matters.
export const ANALYSIS_MAX_SIDE = 640;

export type SkinPixels = { allSkinPixels: Rgb[]; zonePixels: Record<Zone, Rgb[]> };
export type ZoneReadings = Record<Zone, ZoneReading>;

// rgba is the capture's own pixel buffer (width*height*4, a canvas getImageData
// layout). Every skin pixel joins the whole-photo reference; the ones inside a
// zone polygon also join that zone. Without a mask only zone pixels are known
// to be skin, so the reference is then the union of the zones.
export function partitionSkinPixels(capture: FaceCapture, rgba: ArrayLike<number>): SkinPixels {
  const { width, height, landmarks, skinMask } = capture;
  const zonePixels = Object.fromEntries(ZONES.map((zone) => [zone, [] as Rgb[]])) as Record<Zone, Rgb[]>;
  const allSkinPixels: Rgb[] = [];

  // Zones live inside the landmark bounding box; skip the point-in-polygon work everywhere else.
  const { minX, maxX, minY, maxY } = boundingBox(landmarks);

  for (let y = 0; y < height; y++) {
    const ny = (y + 0.5) / height;
    const inFaceRow = ny >= minY && ny <= maxY;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const skin = skinMask ? skinMask[idx] === 1 : false;
      const nx = (x + 0.5) / width;
      const zone = inFaceRow && nx >= minX && nx <= maxX ? assignSpotToZone({ x: nx, y: ny }, landmarks) : null;
      if (!skin && !zone) continue;
      const i = idx * 4;
      const rgb: Rgb = { r: rgba[i], g: rgba[i + 1], b: rgba[i + 2] };
      allSkinPixels.push(rgb);
      if (zone) zonePixels[zone].push(rgb);
    }
  }
  return { allSkinPixels, zonePixels };
}

export function readZones({ allSkinPixels, zonePixels }: SkinPixels): ZoneReadings {
  return Object.fromEntries(
    ZONES.map((zone) => [zone, computeZoneReading(zonePixels[zone], allSkinPixels)]),
  ) as ZoneReadings;
}
