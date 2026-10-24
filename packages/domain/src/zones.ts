import { pointInPolygon, sortPointsByAngleAroundCentroid, type Point2D } from "./geometry";

export type Landmark = { x: number; y: number; z: number };
export type Zone = "forehead" | "leftCheek" | "rightCheek" | "nose" | "chin";

// MediaPipe canonical 468-point face mesh indices, per production-readiness
// ticket 06's research (.scratch/production-readiness/issues/06-zone-landmark-index-map-research.md).
// No official MediaPipe region exists for these four skin-zone groupings (only
// eyes/brows/lips/face-oval are official) — community-sourced, cross-checked.
export const ZONE_INDICES: Record<Zone, number[]> = {
  forehead: [10, 338, 297, 332, 298, 293, 334, 296, 336, 9, 107, 66, 105, 63, 68, 103, 67, 109],
  leftCheek: [116, 117, 118, 119, 120, 121, 128, 126, 142, 36, 205, 206, 207, 213, 192, 147],
  rightCheek: [345, 346, 347, 348, 349, 350, 451, 452, 453, 464, 435, 410, 454, 323, 366, 376],
  nose: [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 237, 238, 239, 240, 241, 242],
  // ponytail: py-feat's `mentalis` seed points aren't a pre-ordered boundary loop
  // (unlike the zones above) — angle-sorted around the centroid in zonePolygon()
  // below. Thinnest-evidenced zone of the five; upgrade if ticket 09's native
  // adapter verification or real fixture testing (ticket 08) flags it.
  chin: [175, 199, 200, 18, 83, 313, 152, 148, 377],
};

export const ZONES = Object.keys(ZONE_INDICES) as Zone[];

// Official MediaPipe connection tables (mediapipe/python/solutions/face_mesh_connections.py),
// shared by web (@mediapipe/tasks-vision) and native (plain face_landmark.tflite).
export const LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const EYE_AND_LIP_EXCLUSIONS = [LEFT_EYE, RIGHT_EYE, LIPS_OUTER];

// Official, but only a lower-brow arc, not a closed ring — no official brow
// outline exists. ponytail: excluded as a padded bounding box rather than a
// true polygon; simplest shape that reliably covers the brow hair without
// inventing an unverified upper boundary.
export const LEFT_EYEBROW = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336];
const RIGHT_EYEBROW = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107];
const EYEBROW_EXCLUSIONS = [LEFT_EYEBROW, RIGHT_EYEBROW];
const EYEBROW_PAD_Y = 0.015;

// No official set; small community reference triangles, not a closed contour.
export const LEFT_NOSTRIL = [129, 218, 166];
const RIGHT_NOSTRIL = [358, 438, 391];
const NOSTRIL_EXCLUSIONS = [LEFT_NOSTRIL, RIGHT_NOSTRIL];

function toPoints(indices: number[], landmarks: Landmark[]): Point2D[] {
  return indices.map((index) => landmarks[index]);
}

function boundingBox(points: Point2D[], padY: number) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys) - padY,
    maxY: Math.max(...ys),
  };
}

function inBoundingBox(point: Point2D, box: ReturnType<typeof boundingBox>): boolean {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}

function isExcluded(point: Point2D, landmarks: Landmark[]): boolean {
  const ringExclusions = [...EYE_AND_LIP_EXCLUSIONS, ...NOSTRIL_EXCLUSIONS];
  if (ringExclusions.some((indices) => pointInPolygon(point, toPoints(indices, landmarks)))) return true;
  if (EYEBROW_EXCLUSIONS.some((indices) => inBoundingBox(point, boundingBox(toPoints(indices, landmarks), EYEBROW_PAD_Y)))) return true;
  return false;
}

export function zonePolygon(zone: Zone, landmarks: Landmark[]): Point2D[] {
  const points = toPoints(ZONE_INDICES[zone], landmarks);
  return zone === "chin" ? sortPointsByAngleAroundCentroid(points) : points;
}

// Per ADR 0001: assigns a normalized face-relative point to one of the 5 skin
// zones, excluding eyes/brows/lips/nostrils. Returns null if the point falls in
// an excluded region or outside every zone.
export function assignSpotToZone(spot: Point2D, landmarks: Landmark[]): Zone | null {
  if (isExcluded(spot, landmarks)) return null;
  for (const zone of ZONES) {
    if (pointInPolygon(spot, zonePolygon(zone, landmarks))) return zone;
  }
  return null;
}
