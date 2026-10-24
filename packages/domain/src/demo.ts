import { windowDays } from "./trend";
import { ZONES, type Zone } from "./zones";

// A named sample history for the no-sign-in demo. Per zone: `end` is the last
// night's redness, `lastWeek` the change over the final seven nights (what
// Hôm nay's direction reads), `perDay` the slow drift in the weeks before.
export type DemoPersona = {
  id: string;
  seed: number;
  zones: Record<Zone, { end: number; lastWeek: number; perDay: number }>;
};

export const DEMO_PERSONA: DemoPersona = {
  id: "oily-cheeks",
  seed: 20260914,
  zones: {
    forehead: { end: 0.9, lastWeek: -0.5, perDay: -0.012 },
    leftCheek: { end: 1.6, lastWeek: 0, perDay: -0.008 },
    rightCheek: { end: 1.4, lastWeek: -0.4, perDay: -0.01 },
    nose: { end: 2.1, lastWeek: 0.5, perDay: 0 },
    chin: { end: 1.1, lastWeek: 0, perDay: 0.004 },
  },
};

// Row shapes as the apps select them from Supabase (snake_case columns).
export type DemoData = {
  photos: { id: string; taken_at: string; storage_path: string }[];
  readings: { photo_id: string; zone: Zone; redness: number; unevenness: number; pixel_count: number }[];
  spots: { photo_id: string; x: number; y: number; zone: Zone }[];
  routineItems: { id: string; label: string; position: number }[];
  entries: { night: string; completed_labels: string[]; item_count: number }[];
};

// mulberry32: tiny seeded PRNG, same sequence for the same seed.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPOT_ZONES: Zone[] = ["leftCheek", "rightCheek", "leftCheek", "rightCheek", "forehead", "chin", "nose"];

// `days` nights ending yesterday, so tonight's photo and routine are still open.
// Timestamps are built in the runtime's local time: call it where the data is shown.
export function generateDemo(persona: DemoPersona, days: number, today: string, routineLabels: string[]): DemoData {
  const rand = random(persona.seed);
  const data: DemoData = {
    photos: [],
    readings: [],
    spots: [],
    routineItems: routineLabels.map((label, position) => ({ id: `demo-item-${position}`, label, position })),
    entries: [],
  };
  const nights = windowDays(days, windowDays(2, today)[0]);
  nights.forEach((night, i) => {
    const ago = nights.length - 1 - i;

    // Missed nights only before the last week, so both streaks are running.
    if (ago < 7 || rand() >= 0.12) {
      const id = `demo-photo-${night}`;
      const [y, m, d] = night.split("-").map(Number);
      data.photos.push({ id, taken_at: new Date(y, m - 1, d, 21, 15 + Math.floor(rand() * 60)).toISOString(), storage_path: `demo/${night}.jpg` });
      for (const zone of ZONES) {
        const { end, lastWeek, perDay } = persona.zones[zone];
        const redness = end - (lastWeek * Math.min(ago, 6)) / 6 - perDay * Math.max(ago - 6, 0) + (rand() - 0.5) * 0.08;
        data.readings.push({ photo_id: id, zone, redness, unevenness: 0.6 + rand() * 0.8, pixel_count: 1800 + Math.floor(rand() * 1500) });
      }
      // The last photo always carries spots: it is the one Hôm nay shows.
      for (let n = ago === 0 ? 3 : Math.floor(rand() * 4); n > 0; n--) {
        data.spots.push({ photo_id: id, x: 0.15 + rand() * 0.7, y: 0.15 + rand() * 0.7, zone: SPOT_ZONES[Math.floor(rand() * SPOT_ZONES.length)] });
      }
    }

    if (ago < 3 || rand() >= 0.1) {
      const done = routineLabels.filter(() => rand() < 0.8);
      data.entries.push({ night, completed_labels: done.length ? done : routineLabels.slice(0, 1), item_count: routineLabels.length });
    }
  });
  return data;
}
