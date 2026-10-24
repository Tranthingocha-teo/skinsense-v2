import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Zone } from '@skinsense/domain';

import { getMobileDemoData } from './demo';
import { fail, type RoutineEntry } from './routine';
import { supabase } from './supabase';

// Same contract as apps/web/src/lib/trends.ts; only the client differs.
export type TrendPhoto = { id: string; taken_at: string; storage_path: string };
export type TrendData = {
  photos: TrendPhoto[]; // oldest first
  readings: { photo_id: string; zone: Zone; redness: number }[];
  spots: { photo_id: string; zone: Zone }[];
  entries: RoutineEntry[];
};

// Everything the Trends screen shows, from local day `firstDay` ("YYYY-MM-DD") onwards.
export async function loadTrends(firstDay: string): Promise<TrendData> {
  const isDemo = (await AsyncStorage.getItem('skinsense_demo_active')) === 'true';
  if (isDemo) {
    const demo = getMobileDemoData();
    const storedPhotosStr = await AsyncStorage.getItem('skinsense_demo_photos');
    const storedPhotos = storedPhotosStr ? JSON.parse(storedPhotosStr) : [];
    const storedReadingsStr = await AsyncStorage.getItem('skinsense_demo_readings');
    const storedReadings = storedReadingsStr ? JSON.parse(storedReadingsStr) : [];
    const storedSpotsStr = await AsyncStorage.getItem('skinsense_demo_spots');
    const storedSpots = storedSpotsStr ? JSON.parse(storedSpotsStr) : {};

    const allPhotos = [...demo.photos, ...storedPhotos];
    const allReadings = [...demo.readings, ...storedReadings];
    const spotRows = [
      ...demo.spots,
      ...Object.entries(storedSpots).flatMap(([photo_id, rows]: [string, any]) =>
        rows.map((r: any) => ({ photo_id, ...r })),
      ),
    ];
    return {
      photos: allPhotos.filter((p) => p.taken_at >= firstDay) as TrendPhoto[],
      readings: allReadings as TrendData['readings'],
      spots: spotRows as TrendData['spots'],
      entries: demo.entries.filter((e) => e.night >= firstDay) as RoutineEntry[],
    };
  }

  const [y, m, d] = firstDay.split('-').map(Number);
  const since = new Date(y, m - 1, d).toISOString();
  const [photos, entries] = await Promise.all([
    supabase.from('photos').select('id,taken_at,storage_path').gte('taken_at', since).order('taken_at'),
    supabase.from('routine_entries').select('night,completed_labels,item_count').gte('night', firstDay),
  ]);
  fail(photos.error);
  fail(entries.error);
  const ids = photos.data!.map((p) => p.id);
  const [readings, spots] = await Promise.all([
    supabase.from('zone_readings').select('photo_id,zone,redness').in('photo_id', ids),
    supabase.from('spots').select('photo_id,zone').in('photo_id', ids),
  ]);
  fail(readings.error);
  fail(spots.error);
  return {
    photos: photos.data as TrendPhoto[],
    readings: readings.data as TrendData['readings'],
    spots: spots.data as TrendData['spots'],
    entries: entries.data as RoutineEntry[],
  };
}

export async function signedPhotoUrls(paths: string[]): Promise<string[]> {
  const isDemo = (await AsyncStorage.getItem('skinsense_demo_active')) === 'true';
  if (isDemo) {
    return paths;
  }
  const { data, error } = await supabase.storage.from('photos').createSignedUrls(paths, 600);
  fail(error);
  return data!.map((d) => d.signedUrl!);
}
