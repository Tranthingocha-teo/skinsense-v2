import { windowDays } from "./trend";

const dayBefore = (day: string) => windowDays(2, day)[0];

// Consecutive local days with a record, ending today — or ending yesterday when
// today has none yet, so the streak doesn't read 0 before tonight's record.
export function streak(days: Set<string>, today: string): number {
  let day = days.has(today) ? today : dayBefore(today);
  let count = 0;
  while (days.has(day)) {
    count++;
    day = dayBefore(day);
  }
  return count;
}
