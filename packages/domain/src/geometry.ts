export type Point2D = { x: number; y: number };

// Turns an unordered point scatter into a simple (non-self-intersecting) polygon
// boundary by sorting around the centroid — a star-shaped hull, not a true convex
// hull, but sufficient for small anatomically-clustered seed sets.
export function sortPointsByAngleAroundCentroid(points: Point2D[]): Point2D[] {
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 },
  );
  return [...points].sort(
    (a, b) => Math.atan2(a.y - centroid.y, a.x - centroid.x) - Math.atan2(b.y - centroid.y, b.x - centroid.x),
  );
}

// Ray-casting (even-odd rule).
export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crossesRay =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crossesRay) inside = !inside;
  }
  return inside;
}

export type BoundingBox = { minX: number; maxX: number; minY: number; maxY: number };

export function boundingBox(points: Point2D[]): BoundingBox {
  const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const p of points) {
    if (p.x < box.minX) box.minX = p.x;
    if (p.x > box.maxX) box.maxX = p.x;
    if (p.y < box.minY) box.minY = p.y;
    if (p.y > box.maxY) box.maxY = p.y;
  }
  return box;
}

// Spot coordinates are stored relative to the photo's landmark bounding box
// (0..1 inside the face), not the image, so a spot keeps its place on the face
// when a later photo is framed differently (spec.md story 8).
export function toFaceRelative(p: Point2D, box: BoundingBox): Point2D {
  return { x: (p.x - box.minX) / (box.maxX - box.minX), y: (p.y - box.minY) / (box.maxY - box.minY) };
}

export function fromFaceRelative(p: Point2D, box: BoundingBox): Point2D {
  return { x: box.minX + p.x * (box.maxX - box.minX), y: box.minY + p.y * (box.maxY - box.minY) };
}
