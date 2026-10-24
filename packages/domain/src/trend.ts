// Trend math over daily buckets (spec.md "Trends"). Days are local calendar
// dates as "YYYY-MM-DD"; callers bucket their own timestamps with localDay.

export type DayPoint = { day: string; value: number | null };
export type TrendDirection = "up" | "down" | "flat";

export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The last `days` local days ending on `today`, oldest first.
export function windowDays(days: number, today: string): string[] {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: days }, (_, i) => localDay(new Date(y, m - 1, d - (days - 1 - i))));
}

// One point per window day: the mean of that day's samples, null when none.
export function dailySeries(days: string[], samples: { day: string; value: number }[]): DayPoint[] {
  const sums = new Map<string, { total: number; n: number }>();
  for (const s of samples) {
    const acc = sums.get(s.day) ?? { total: 0, n: 0 };
    sums.set(s.day, { total: acc.total + s.value, n: acc.n + 1 });
  }
  return days.map((day) => {
    const acc = sums.get(day);
    return { day, value: acc ? acc.total / acc.n : null };
  });
}

// ponytail: first-vs-last present value; a fitted slope would resist a noisy
// endpoint, add when the series is long enough to make one meaningful.
export function trendDirection(series: DayPoint[], tolerance: number): TrendDirection | null {
  const present = series.filter((p): p is { day: string; value: number } => p.value !== null);
  if (present.length < 2) return null;
  const delta = present[present.length - 1].value - present[0].value;
  if (Math.abs(delta) <= tolerance) return "flat";
  return delta > 0 ? "up" : "down";
}

// Share (0..1) of one zone's redness against tonight's highest reading, for the Hôm nay zone bars; negative a* counts as 0.
export function rednessShare(value: number, values: number[]): number {
  const max = Math.max(0, ...values);
  return max > 0 ? Math.max(0, value) / max : 0;
}
