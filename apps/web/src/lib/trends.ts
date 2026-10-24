import type { Zone } from "@skinsense/domain";
import { fail, type RoutineEntry } from "@/lib/routine";
import { createClient } from "@/lib/supabase/client";

export const FLAT_TOLERANCE = 0.1; // a* units; below this a zone's line reads as steady

export type TrendPhoto = { id: string; taken_at: string; storage_path: string };
export type TrendData = {
  photos: TrendPhoto[]; // oldest first
  readings: { photo_id: string; zone: Zone; redness: number }[];
  spots: { photo_id: string; zone: Zone }[];
  entries: RoutineEntry[];
};

// Everything the Trends screen shows, from local day `firstDay` ("YYYY-MM-DD") onwards.
export async function loadTrends(firstDay: string): Promise<TrendData> {
  const supabase = createClient();
  const [y, m, d] = firstDay.split("-").map(Number);
  const since = new Date(y, m - 1, d).toISOString();
  const [photos, entries] = await Promise.all([
    supabase.from("photos").select("id,taken_at,storage_path").gte("taken_at", since).order("taken_at"),
    supabase.from("routine_entries").select("night,completed_labels,item_count").gte("night", firstDay),
  ]);
  fail(photos.error);
  fail(entries.error);
  const ids = photos.data!.map((p) => p.id);
  const [readings, spots] = await Promise.all([
    supabase.from("zone_readings").select("photo_id,zone,redness").in("photo_id", ids),
    supabase.from("spots").select("photo_id,zone").in("photo_id", ids),
  ]);
  fail(readings.error);
  fail(spots.error);
  return {
    photos: photos.data as TrendPhoto[],
    readings: readings.data as TrendData["readings"],
    spots: spots.data as TrendData["spots"],
    entries: entries.data as RoutineEntry[],
  };
}

export async function signedPhotoUrls(paths: string[]): Promise<string[]> {
  const { data, error } = await createClient().storage.from("photos").createSignedUrls(paths, 600);
  fail(error);
  return data!.map((d) => d.signedUrl!);
}
