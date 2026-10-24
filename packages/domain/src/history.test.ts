import { describe, expect, it } from "vitest";
import { groupByMonth, reddestReading } from "./history";

const photo = (id: string, date: Date) => ({ id, taken_at: date.toISOString() });

describe("groupByMonth", () => {
  it("groups Photos by local month, newest month and newest Photo first", () => {
    const groups = groupByMonth([
      photo("aug30", new Date(2026, 7, 30, 21, 0)),
      photo("sep13", new Date(2026, 8, 13, 22, 14)),
      photo("sep01", new Date(2026, 8, 1, 21, 30)),
      photo("sep12", new Date(2026, 8, 12, 21, 0)),
    ]);
    expect(groups.map((g) => [g.month, g.photos.map((p) => p.id)])).toEqual([
      ["2026-09", ["sep13", "sep12", "sep01"]],
      ["2026-08", ["aug30"]],
    ]);
  });

  it("uses the local month, so a photo after midnight on the 1st belongs to the new month", () => {
    const groups = groupByMonth([photo("late", new Date(2026, 7, 31, 23, 50)), photo("early", new Date(2026, 8, 1, 0, 10))]);
    expect(groups.map((g) => g.month)).toEqual(["2026-09", "2026-08"]);
  });

  it("keeps the same month of different years apart", () => {
    const groups = groupByMonth([photo("2025", new Date(2025, 8, 5)), photo("2026", new Date(2026, 8, 5))]);
    expect(groups.map((g) => g.month)).toEqual(["2026-09", "2025-09"]);
  });

  it("is empty without photos", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe("reddestReading", () => {
  it("is the ZoneReading with the highest redness", () => {
    const readings = [{ zone: "chin", redness: 2 }, { zone: "nose", redness: 7 }, { zone: "forehead", redness: -1 }];
    expect(reddestReading(readings)).toEqual({ zone: "nose", redness: 7 });
  });

  it("is undefined when the Photo has no readings", () => {
    expect(reddestReading([])).toBeUndefined();
  });
});
