import { describe, expect, it } from "vitest";
import { dailySeries, localDay, rednessShare, trendDirection, windowDays } from "./trend";

describe("localDay", () => {
  it("formats a Date as its local calendar day", () => {
    expect(localDay(new Date(2026, 8, 3, 23, 30))).toBe("2026-09-03");
  });
});

describe("windowDays", () => {
  it("lists the last N local days ending today, oldest first", () => {
    expect(windowDays(3, "2026-09-13")).toEqual(["2026-09-11", "2026-09-12", "2026-09-13"]);
  });

  it("crosses a month boundary", () => {
    expect(windowDays(2, "2026-10-01")).toEqual(["2026-09-30", "2026-10-01"]);
  });
});

describe("dailySeries", () => {
  const days = ["2026-09-11", "2026-09-12", "2026-09-13"];

  it("averages the samples of each day and leaves days without samples null", () => {
    const samples = [
      { day: "2026-09-11", value: 2 },
      { day: "2026-09-11", value: 4 },
      { day: "2026-09-13", value: 1 },
    ];
    expect(dailySeries(days, samples)).toEqual([
      { day: "2026-09-11", value: 3 },
      { day: "2026-09-12", value: null },
      { day: "2026-09-13", value: 1 },
    ]);
  });

  it("ignores samples outside the window", () => {
    expect(dailySeries(days, [{ day: "2026-09-01", value: 9 }]).every((p) => p.value === null)).toBe(true);
  });
});

describe("trendDirection", () => {
  const series = (values: (number | null)[]) => values.map((value, i) => ({ day: String(i), value }));

  it("compares the last present value with the first present value", () => {
    expect(trendDirection(series([2.4, null, 0.9]), 0.1)).toBe("down");
    expect(trendDirection(series([null, 1, 2]), 0.1)).toBe("up");
  });

  it("is flat within the tolerance", () => {
    expect(trendDirection(series([1, 1.05]), 0.1)).toBe("flat");
  });

  it("is null with fewer than two present values", () => {
    expect(trendDirection(series([null, 1, null]), 0.1)).toBeNull();
    expect(trendDirection(series([]), 0.1)).toBeNull();
  });
});

describe("rednessShare", () => {
  it("is the value's share of the highest reading tonight", () => {
    expect(rednessShare(2, [8, 2, 4])).toBe(0.25);
    expect(rednessShare(8, [8, 2, 4])).toBe(1);
  });

  it("clamps negative a* values to 0", () => {
    expect(rednessShare(-3, [6, -3])).toBe(0);
  });

  it("is 0 when no reading is above 0", () => {
    expect(rednessShare(0, [0, -1])).toBe(0);
  });
});
