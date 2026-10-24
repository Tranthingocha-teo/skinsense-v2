import { describe, expect, it } from "vitest";

import { nextReminderTriggers } from "./reminder";

const EVERY_DAY = new Set([0, 1, 2, 3, 4, 5, 6]);
const at = { hour: 21, minute: 30 };
// Local-time constructors: the assertions hold in whatever timezone the device (or CI) runs.
// 2026-09-15 is a Tuesday (getDay 2).
const tuesday = (hour: number, minute = 0) => new Date(2026, 8, 15, hour, minute);

describe("nextReminderTriggers", () => {
  it("starts today when the time is still ahead, one instant per chosen weekday", () => {
    const triggers = nextReminderTriggers(at, EVERY_DAY, tuesday(20));
    expect(triggers).toHaveLength(7);
    expect(triggers[0]).toEqual(new Date(2026, 8, 15, 21, 30));
    expect(triggers[6]).toEqual(new Date(2026, 8, 21, 21, 30));
  });

  it("moves today to next week when the time has already passed", () => {
    const triggers = nextReminderTriggers(at, EVERY_DAY, tuesday(22));
    expect(triggers[0]).toEqual(new Date(2026, 8, 16, 21, 30));
    expect(triggers[6]).toEqual(new Date(2026, 8, 22, 21, 30));
  });

  it("treats the exact minute as passed", () => {
    expect(nextReminderTriggers(at, new Set([2]), tuesday(21, 30))).toEqual([new Date(2026, 8, 22, 21, 30)]);
  });

  it("keeps only the chosen weekdays, in time order, across a month boundary", () => {
    // Sunday 2026-09-27: Monday and Friday fall on 28/09 and 02/10.
    const triggers = nextReminderTriggers({ hour: 7, minute: 5 }, new Set([5, 1]), new Date(2026, 8, 27, 12));
    expect(triggers).toEqual([new Date(2026, 8, 28, 7, 5), new Date(2026, 9, 2, 7, 5)]);
  });

  it("returns every instant in local wall-clock time", () => {
    for (const d of nextReminderTriggers(at, EVERY_DAY, tuesday(9))) {
      expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([21, 30, 0]);
    }
  });

  it("returns nothing without weekdays", () => {
    expect(nextReminderTriggers(at, new Set(), tuesday(9))).toEqual([]);
  });
});
