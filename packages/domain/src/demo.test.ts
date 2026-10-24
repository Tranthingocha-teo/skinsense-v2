import { describe, expect, it } from "vitest";
import { DEMO_PERSONA, generateDemo } from "./demo";
import { streak } from "./streak";
import { dailySeries, localDay, trendDirection, windowDays } from "./trend";
import { ZONES } from "./zones";

const TODAY = "2026-09-14";
const LABELS = ["Makeup remover", "Cleanser", "Acne serum", "Moisturizer"];
const demo = () => generateDemo(DEMO_PERSONA, 90, TODAY, LABELS);

describe("generateDemo", () => {
  it("is deterministic for a persona", () => {
    expect(demo()).toEqual(demo());
  });

  it("covers 90 days ending yesterday, so tonight is still open", () => {
    const { photos, entries } = demo();
    const days = new Set(photos.map((p) => localDay(new Date(p.taken_at))));
    const window = windowDays(90, "2026-09-13");
    expect([...days].every((d) => window.includes(d))).toBe(true);
    expect(days.has(window[0]) || days.has(window[1])).toBe(true);
    expect(days.has(TODAY)).toBe(false);
    expect(entries.some((e) => e.night === TODAY)).toBe(false);
  });

  it("emits rows in the shapes the apps load", () => {
    const { photos, readings, spots, routineItems, entries } = demo();
    expect(Object.keys(photos[0]).sort()).toEqual(["id", "storage_path", "taken_at"]);
    expect(Object.keys(readings[0]).sort()).toEqual(["photo_id", "pixel_count", "redness", "unevenness", "zone"]);
    expect(Object.keys(spots[0]).sort()).toEqual(["photo_id", "x", "y", "zone"]);
    expect(routineItems).toEqual(LABELS.map((label, position) => ({ id: expect.any(String), label, position })));
    expect(Object.keys(entries[0]).sort()).toEqual(["completed_labels", "item_count", "night"]);
    // One reading per zone per photo; every spot and reading points at a photo.
    const ids = new Set(photos.map((p) => p.id));
    expect(readings).toHaveLength(photos.length * ZONES.length);
    expect([...readings, ...spots].every((r) => ids.has(r.photo_id))).toBe(true);
    expect(entries.every((e) => e.completed_labels.every((l) => LABELS.includes(l)) && e.item_count === LABELS.length)).toBe(true);
  });

  it("keeps readings and spot coordinates in realistic ranges", () => {
    const { readings, spots } = demo();
    expect(readings.every((r) => r.redness > -1 && r.redness < 5 && r.unevenness > 0 && r.pixel_count > 0)).toBe(true);
    expect(spots.every((s) => s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1 && ZONES.includes(s.zone))).toBe(true);
  });

  it("makes Hôm nay non-trivial: both streaks running, missed days, every direction", () => {
    const { photos, readings, entries } = demo();
    const photoDay = new Map(photos.map((p) => [p.id, localDay(new Date(p.taken_at))]));
    const captureDays = new Set(photoDay.values());
    const routineDays = new Set(entries.filter((e) => e.completed_labels.length > 0).map((e) => e.night));
    expect(streak(captureDays, TODAY)).toBeGreaterThanOrEqual(7);
    expect(streak(routineDays, TODAY)).toBeGreaterThanOrEqual(3);
    expect(captureDays.size).toBeLessThan(90);
    expect(routineDays.size).toBeLessThan(90);

    const week = windowDays(7, TODAY);
    const directions = ZONES.map((zone) =>
      trendDirection(
        dailySeries(week, readings.filter((r) => r.zone === zone).map((r) => ({ day: photoDay.get(r.photo_id)!, value: r.redness }))),
        0.1, // web's FLAT_TOLERANCE
      ),
    );
    expect(new Set(directions)).toEqual(new Set(["down", "flat", "up"]));
  });
});
