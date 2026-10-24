// Before/after pair selection for Xu hướng (spec.md "Domain package additions").
// `photos` are the range's Photos in any order; days are local "YYYY-MM-DD".
import { localDay } from "./trend";

type Dated = { taken_at: string };

const dayOf = (p: Dated) => localDay(new Date(p.taken_at));
const byTime = <P extends Dated>(photos: P[]) => [...photos].sort((a, b) => Date.parse(a.taken_at) - Date.parse(b.taken_at));

// The days of `range` that have at least one Photo, in range order.
export function photoDays(range: string[], photos: Dated[]): string[] {
  const days = new Set(photos.map(dayOf));
  return range.filter((day) => days.has(day));
}

export function latestPhotoOfDay<P extends Dated>(photos: P[], day: string): P | undefined {
  return byTime(photos).filter((p) => dayOf(p) === day).at(-1);
}

// The chosen days' latest Photos (earlier day first); the first and last Photo
// when nothing is chosen or a chosen day has none; null below two Photos.
export function comparisonPair<P extends Dated>(photos: P[], chosen?: [string, string]): { before: P; after: P } | null {
  if (photos.length < 2) return null;
  if (chosen && chosen[0] !== chosen[1]) {
    const [first, second] = [...chosen].sort();
    const before = latestPhotoOfDay(photos, first);
    const after = latestPhotoOfDay(photos, second);
    if (before && after) return { before, after };
  }
  const sorted = byTime(photos);
  return { before: sorted[0], after: sorted.at(-1)! };
}
