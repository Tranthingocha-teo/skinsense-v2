import { ZONE_INDICES, ZONES } from "@skinsense/domain";
import { describe, expect, it } from "vitest";
import { FACE_MESH } from "./face-mesh";
import { COUNT, SCATTER, ZONE_OF, ZONE_OFFSET, positionAt, presenceAt, progressFor } from "./face-scenes";

const at = (p: number, i: number) => positionAt(i, p, [0, 0, 0]).map((v) => +v.toFixed(4));
const face = (i: number) => [FACE_MESH[i * 3], FACE_MESH[i * 3 + 1], FACE_MESH[i * 3 + 2]].map((v) => +v.toFixed(4));
const inZone = ZONES.flatMap((z) => ZONE_INDICES[z]);
const outside = [0, 151, 467].filter((i) => !inZone.includes(i));

describe("face scenes", () => {
  it("has one scatter and face position per landmark and a zone for every zone landmark", () => {
    expect(COUNT).toBe(468);
    expect(SCATTER).toHaveLength(COUNT * 3);
    for (const [k, zone] of ZONES.entries()) for (const i of ZONE_INDICES[zone]) expect(ZONE_OF[i]).toBe(k);
    for (const i of outside) expect(ZONE_OF[i]).toBe(-1);
  });

  it("scatters at 0, forms the face by the middle and splits the five zones apart by the end", () => {
    for (const i of [...outside, ...ZONES.map((z) => ZONE_INDICES[z][0])]) {
      expect(at(0, i)).toEqual([SCATTER[i * 3], SCATTER[i * 3 + 1], SCATTER[i * 3 + 2]].map((v) => +v.toFixed(4)));
      expect(at(0.5, i)).toEqual(face(i));
    }
    for (const i of outside) expect(at(1, i)).toEqual(face(i));
    for (const [k, zone] of ZONES.entries()) {
      const [dx, dy, dz] = ZONE_OFFSET[k];
      for (const i of ZONE_INDICES[zone]) {
        const [x, y, z] = face(i);
        expect(at(1, i)).toEqual([x + dx, y + dy, z + dz].map((v) => +v.toFixed(4)));
      }
    }
  });

  it("moves the forehead up, the chin down, the cheeks apart and the nose forward", () => {
    const [forehead, leftCheek, rightCheek, nose, chin] = ZONE_OFFSET;
    expect(forehead[1]).toBeGreaterThan(0);
    expect(chin[1]).toBeLessThan(0);
    expect(Math.sign(leftCheek[0])).toBe(-Math.sign(rightCheek[0]));
    expect(nose[2]).toBeGreaterThan(0);
  });

  it("keeps every point present until the split, then dims the points outside the zones", () => {
    for (const i of [...outside, ...inZone]) {
      expect(presenceAt(i, 0)).toBe(1);
      expect(presenceAt(i, 0.5)).toBe(1);
    }
    for (const i of inZone) expect(presenceAt(i, 1)).toBe(1);
    for (const i of outside) expect(presenceAt(i, 1)).toBeCloseTo(0.3);
  });

  it("maps the box's place in the viewport to progress: 0 entering at the bottom, 1 centred", () => {
    expect(progressFor(900, 600, 900)).toBe(0);
    expect(progressFor(150, 600, 900)).toBe(1);
    expect(progressFor(525, 600, 900)).toBeCloseTo(0.5);
    expect(progressFor(-400, 600, 900)).toBe(1);
    expect(progressFor(1200, 600, 900)).toBe(0);
  });
});
