import { localDay } from "./trend";

// Photo history (spec "Features"): Photos grouped by local month "YYYY-MM",
// newest month first and newest Photo first inside each month.
export function groupByMonth<T extends { taken_at: string }>(photos: T[]): { month: string; photos: T[] }[] {
  const groups = new Map<string, T[]>();
  const newest = [...photos].sort((a, b) => Date.parse(b.taken_at) - Date.parse(a.taken_at));
  for (const p of newest) {
    const month = localDay(new Date(p.taken_at)).slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), p]);
  }
  return [...groups].map(([month, list]) => ({ month, photos: list }));
}

// Photo detail shows the reddest ZoneReading of that night.
export function reddestReading<T extends { redness: number }>(readings: T[]): T | undefined {
  return readings.reduce<T | undefined>((top, r) => (!top || r.redness > top.redness ? r : top), undefined);
}
