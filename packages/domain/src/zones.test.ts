import { describe, expect, it } from "vitest";
import { pointInPolygon } from "./geometry";
import {
  assignSpotToZone,
  LEFT_EYE,
  LEFT_EYEBROW,
  LEFT_NOSTRIL,
  ZONE_INDICES,
  zonePolygon,
  type Landmark,
} from "./zones";

// Synthetic layout: each zone's real landmark indices are placed on a small
// circle around a distinct center, in the zone's own index-list order (already
// boundary-ordered per the research, except chin — deliberately scrambled here
// to prove the angle-sort recovers a valid polygon). Exclusion regions are
// placed overlapping a zone's circle but off its center point, so a test can
// tell "excluded" apart from "just not in any zone". Not anatomically real;
// this tests the assignment mechanism, not real face geometry. Indices are
// imported from zones.ts itself, not duplicated, so a future correction there
// can't silently drift out of sync with this test.
function circleOfPoints(center: { x: number; y: number }, radius: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle), z: 0 };
  });
}

const FOREHEAD_INDICES = ZONE_INDICES.forehead;
const LEFT_CHEEK_INDICES = ZONE_INDICES.leftCheek;
const RIGHT_CHEEK_INDICES = ZONE_INDICES.rightCheek;
const NOSE_INDICES = ZONE_INDICES.nose;
const CHIN_INDICES = ZONE_INDICES.chin;
const LEFT_EYE_INDICES = LEFT_EYE;
const LEFT_EYEBROW_INDICES = LEFT_EYEBROW;
const LEFT_NOSTRIL_INDICES = LEFT_NOSTRIL;

function makeLandmarks(): Landmark[] {
  const far = { x: -100, y: -100, z: 0 };
  const landmarks: Landmark[] = Array.from({ length: 468 }, () => far);
  const place = (indices: number[], points: { x: number; y: number; z: number }[]) => {
    indices.forEach((index, i) => (landmarks[index] = points[i]));
  };

  place(FOREHEAD_INDICES, circleOfPoints({ x: 0.5, y: 0.1 }, 0.05, FOREHEAD_INDICES.length));
  place(LEFT_CHEEK_INDICES, circleOfPoints({ x: 0.2, y: 0.5 }, 0.05, LEFT_CHEEK_INDICES.length));
  place(RIGHT_CHEEK_INDICES, circleOfPoints({ x: 0.8, y: 0.5 }, 0.05, RIGHT_CHEEK_INDICES.length));
  place(NOSE_INDICES, circleOfPoints({ x: 0.5, y: 0.5 }, 0.05, NOSE_INDICES.length));

  // Scrambled on purpose: chin's real indices are an unordered seed set, not a
  // pre-ordered boundary loop, per the research.
  const chinPoints = circleOfPoints({ x: 0.5, y: 0.9 }, 0.05, CHIN_INDICES.length);
  const scrambledChinPoints = [chinPoints[3], chinPoints[0], chinPoints[2], chinPoints[1], ...chinPoints.slice(4)];
  place(CHIN_INDICES, scrambledChinPoints);

  // Overlaps the forehead circle without coinciding with its center point.
  place(LEFT_EYE_INDICES, circleOfPoints({ x: 0.52, y: 0.11 }, 0.01, LEFT_EYE_INDICES.length));

  // Overlaps the left-cheek circle without coinciding with its center point.
  place(LEFT_EYEBROW_INDICES, circleOfPoints({ x: 0.22, y: 0.5 }, 0.01, LEFT_EYEBROW_INDICES.length));

  // Overlaps the nose circle without coinciding with its center point.
  place(LEFT_NOSTRIL_INDICES, [
    { x: 0.47, y: 0.49, z: 0 },
    { x: 0.48, y: 0.49, z: 0 },
    { x: 0.475, y: 0.495, z: 0 },
  ]);

  return landmarks;
}

describe("zonePolygon", () => {
  it("recovers a valid polygon for chin from a scrambled seed-point order", () => {
    const landmarks = makeLandmarks();
    const polygon = zonePolygon("chin", landmarks);
    // Centroid of the chin circle is (0.5, 0.9); only a correctly-ordered
    // (non-self-intersecting) polygon reliably contains it.
    expect(pointInPolygon({ x: 0.5, y: 0.9 }, polygon)).toBe(true);
  });
});

describe("assignSpotToZone", () => {
  it("assigns a spot at a zone's center to that zone", () => {
    const landmarks = makeLandmarks();
    expect(assignSpotToZone({ x: 0.5, y: 0.1 }, landmarks)).toBe("forehead");
    expect(assignSpotToZone({ x: 0.2, y: 0.5 }, landmarks)).toBe("leftCheek");
    expect(assignSpotToZone({ x: 0.8, y: 0.5 }, landmarks)).toBe("rightCheek");
    expect(assignSpotToZone({ x: 0.5, y: 0.5 }, landmarks)).toBe("nose");
    expect(assignSpotToZone({ x: 0.5, y: 0.9 }, landmarks)).toBe("chin");
  });

  it("returns null for a spot outside every zone", () => {
    const landmarks = makeLandmarks();
    expect(assignSpotToZone({ x: 0.99, y: 0.01 }, landmarks)).toBeNull();
  });

  it("returns null for a spot inside an eye exclusion, even though it also falls inside a zone polygon", () => {
    const landmarks = makeLandmarks();
    expect(assignSpotToZone({ x: 0.52, y: 0.11 }, landmarks)).toBeNull();
  });

  it("returns null for a spot inside the padded eyebrow bounding box", () => {
    const landmarks = makeLandmarks();
    expect(assignSpotToZone({ x: 0.22, y: 0.5 }, landmarks)).toBeNull();
  });

  it("returns null for a spot inside a nostril triangle", () => {
    const landmarks = makeLandmarks();
    expect(assignSpotToZone({ x: 0.475, y: 0.49167 }, landmarks)).toBeNull();
  });
});
