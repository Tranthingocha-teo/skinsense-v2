import { describe, expect, it } from "vitest";
import { comparisonPair, latestPhotoOfDay, photoDays } from "./compare";

// Local wall-clock times, so the tests hold in any runtime timezone.
const photo = (id: string, day: number, hour: number) => ({ id, taken_at: new Date(2026, 8, day, hour).toISOString() });

const photos = [photo("a", 7, 21), photo("b", 9, 20), photo("c", 9, 23), photo("d", 13, 21)];

describe("photoDays", () => {
  it("lists the days of the range that have Photos, oldest first", () => {
    const range = ["2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"];
    expect(photoDays(range, photos)).toEqual(["2026-09-09", "2026-09-13"]);
  });

  it("is empty for a range without Photos", () => {
    expect(photoDays(["2026-09-14"], photos)).toEqual([]);
  });
});

describe("latestPhotoOfDay", () => {
  it("returns the last Photo taken that local day", () => {
    expect(latestPhotoOfDay(photos, "2026-09-09")?.id).toBe("c");
  });

  it("returns undefined for a day without Photos", () => {
    expect(latestPhotoOfDay(photos, "2026-09-10")).toBeUndefined();
  });
});

describe("comparisonPair", () => {
  it("defaults to the first and last Photo of the range", () => {
    const pair = comparisonPair([photos[3], photos[0], photos[1]]);
    expect([pair?.before.id, pair?.after.id]).toEqual(["a", "d"]);
  });

  it("uses the latest Photo of each chosen day, earlier day first", () => {
    const pair = comparisonPair(photos, ["2026-09-13", "2026-09-09"]);
    expect([pair?.before.id, pair?.after.id]).toEqual(["c", "d"]);
  });

  it("falls back to the default pair when a chosen day has no Photo in the range", () => {
    const pair = comparisonPair(photos, ["2026-09-01", "2026-09-09"]);
    expect([pair?.before.id, pair?.after.id]).toEqual(["a", "d"]);
  });

  it("is null for an empty range or a single Photo", () => {
    expect(comparisonPair([])).toBeNull();
    expect(comparisonPair([photos[0]])).toBeNull();
  });
});
