import { describe, expect, it } from "vitest";
import { computeZoneReading, type Rgb } from "./redness";

const flatSkin: Rgb = { r: 200, g: 150, b: 130 };
const redPatch: Rgb = { r: 220, g: 110, b: 100 };

function repeat(color: Rgb, count: number): Rgb[] {
  return Array.from({ length: count }, () => color);
}

describe("computeZoneReading", () => {
  it("reads redness near zero for a zone matching the whole-photo skin reference", () => {
    const allSkinPixels = repeat(flatSkin, 100);
    const zonePixels = repeat(flatSkin, 20);

    const reading = computeZoneReading(zonePixels, allSkinPixels);

    expect(reading.redness).toBeCloseTo(0, 1);
    expect(reading.pixelCount).toBe(20);
  });

  it("reads positive redness for a zone redder than the whole-photo reference (full pixel->CIELAB pipeline)", () => {
    // Half the photo is flat skin, half is a red patch: the patch zone should
    // read redder than the whole-photo median, exercising sRGB->Lab end to end.
    const allSkinPixels = [...repeat(flatSkin, 50), ...repeat(redPatch, 50)];
    const zonePixels = repeat(redPatch, 50);

    const reading = computeZoneReading(zonePixels, allSkinPixels);

    expect(reading.redness).toBeGreaterThan(0);
  });

  it("reads higher unevenness for a zone mixing flat skin and a red patch than a uniform zone", () => {
    const allSkinPixels = [...repeat(flatSkin, 50), ...repeat(redPatch, 50)];
    const mixedZone = [...repeat(flatSkin, 10), ...repeat(redPatch, 10)];
    const uniformZone = repeat(flatSkin, 20);

    const mixed = computeZoneReading(mixedZone, allSkinPixels);
    const uniform = computeZoneReading(uniformZone, allSkinPixels);

    expect(mixed.unevenness).toBeGreaterThan(uniform.unevenness);
  });

  it("reads zero, not NaN, for a zone with no pixels (occluded or cropped out of frame)", () => {
    const allSkinPixels = repeat(flatSkin, 100);

    const reading = computeZoneReading([], allSkinPixels);

    expect(reading).toEqual({ redness: 0, unevenness: 0, pixelCount: 0 });
  });
});
