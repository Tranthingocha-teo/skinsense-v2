import { describe, expect, it } from "vitest";
import { fromFaceRelative, pointInPolygon, sortPointsByAngleAroundCentroid, toFaceRelative } from "./geometry";

describe("pointInPolygon", () => {
  const unitSquare = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];

  it("is true for a point inside the polygon", () => {
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, unitSquare)).toBe(true);
  });

  it("is false for a point outside the polygon", () => {
    expect(pointInPolygon({ x: 1.5, y: 0.5 }, unitSquare)).toBe(false);
  });

  it("is false for a point outside on a diagonal", () => {
    expect(pointInPolygon({ x: -0.1, y: -0.1 }, unitSquare)).toBe(false);
  });

  it("handles a non-convex polygon (L-shape) correctly", () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ];
    expect(pointInPolygon({ x: 1.5, y: 1.5 }, lShape)).toBe(false);
    expect(pointInPolygon({ x: 0.5, y: 1.5 }, lShape)).toBe(true);
  });
});

describe("sortPointsByAngleAroundCentroid", () => {
  it("turns a scrambled scatter of a rectangle's corners into its simple (non-self-intersecting) boundary", () => {
    const scrambled = [
      { x: 0, y: 0 },
      { x: 4, y: 2 }, // diagonally opposite corner, out of boundary order
      { x: 4, y: 0 },
      { x: 0, y: 2 },
    ];

    const sorted = sortPointsByAngleAroundCentroid(scrambled);

    expect(pointInPolygon({ x: 1, y: 1 }, sorted)).toBe(true);
    expect(pointInPolygon({ x: 10, y: 10 }, sorted)).toBe(false);
  });
});

describe("face-relative coordinates", () => {
  const box = { minX: 0.2, maxX: 0.6, minY: 0.1, maxY: 0.9 };
  it("maps an image point into the landmark box's unit square and back", () => {
    const relative = toFaceRelative({ x: 0.4, y: 0.5 }, box);
    expect(relative.x).toBeCloseTo(0.5);
    expect(relative.y).toBeCloseTo(0.5);
    const back = fromFaceRelative(relative, box);
    expect(back.x).toBeCloseTo(0.4);
    expect(back.y).toBeCloseTo(0.5);
  });
  it("lands on the same face spot when a later photo is framed differently", () => {
    const relative = toFaceRelative({ x: 0.3, y: 0.3 }, box);
    const shifted = { minX: 0.4, maxX: 0.6, minY: 0.3, maxY: 0.7 }; // face half the size, moved right and down
    const moved = fromFaceRelative(relative, shifted);
    expect(moved.x).toBeCloseTo(0.45);
    expect(moved.y).toBeCloseTo(0.4);
  });
});
