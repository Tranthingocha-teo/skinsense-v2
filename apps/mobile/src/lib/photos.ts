import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';

import { ZONES, type Zone, type ZoneReadings } from '@skinsense/domain';

import { fail } from './routine';
import { supabase } from './supabase';

// Same contract as apps/web/src/lib/photos.ts; only the client differs.
const BUCKET = 'photos';
const GHOST_URL_TTL_SECONDS = 600;

async function latestPhoto() {
  const latest = await supabase
    .from('photos')
    .select('id,storage_path')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  fail(latest.error);
  return latest.data;
}

export async function latestPhotoId(): Promise<string | null> {
  return (await latestPhoto())?.id ?? null;
}

// The previous photo, as a short-lived signed URL, for the capture ghost overlay.
export async function latestPhotoUrl(): Promise<string | null> {
  const latest = await latestPhoto();
  if (!latest) return null;
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(latest.storage_path, GHOST_URL_TTL_SECONDS);
  fail(signed.error);
  return signed.data!.signedUrl;
}

// Image first (an ArrayBuffer, never base64 — it corrupts on Android), then the
// Photo row, then one ZoneReading per zone. Path `${auth.uid()}/${photoId}.jpg`
// is what the storage owner-folder policy checks.
export async function savePhoto(input: {
  image: ArrayBuffer;
  brightness: number;
  awbLocked: boolean;
  readings: ZoneReadings;
}): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('not signed in');
  const id = Crypto.randomUUID();
  const storagePath = `${userId}/${id}.jpg`;

  const upload = await supabase.storage.from(BUCKET).upload(storagePath, input.image, { contentType: 'image/jpeg' });
  fail(upload.error);

  // A Photo row without its readings would read as a valid capture everywhere
  // else; roll both the row (cascade) and the object back if either insert fails.
  try {
    const photo = await supabase
      .from('photos')
      .insert({ id, storage_path: storagePath, brightness: input.brightness, awb_locked: input.awbLocked });
    fail(photo.error);
    const readings = await supabase.from('zone_readings').insert(
      ZONES.map((zone) => ({
        photo_id: id,
        zone,
        redness: input.readings[zone].redness,
        unevenness: input.readings[zone].unevenness,
        pixel_count: input.readings[zone].pixelCount,
      })),
    );
    fail(readings.error);
  } catch (error) {
    await supabase.from('photos').delete().eq('id', id);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  return id;
}

export type SpotRow = { x: number; y: number; zone: Zone };

// The stored JPEG downloaded to the cache dir, as a file:// URI — nitro-image
// loads from a path, not a URL, and the landmarker has to re-run on the pixels.
export async function loadPhoto(id: string): Promise<string> {
  const photo = await supabase.from('photos').select('storage_path').eq('id', id).single();
  fail(photo.error);
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(photo.data!.storage_path, GHOST_URL_TTL_SECONDS);
  fail(signed.error);
  const file = await File.downloadFileAsync(signed.data!.signedUrl, new File(Paths.cache, `${id}.jpg`), { idempotent: true });
  return file.uri;
}

export async function loadSpots(photoId: string): Promise<SpotRow[]> {
  const { data, error } = await supabase.from('spots').select('x,y,zone').eq('photo_id', photoId);
  fail(error);
  return data as SpotRow[];
}

// One Save replaces the photo's whole spot set; coordinates are face-relative
// (domain's toFaceRelative) with the zone assigned at mark time (schema.ts).
// ponytail: insert the new set first, then drop the old rows, so a failure
// between the two keeps the old set instead of losing it; a failed delete leaves
// duplicates that the next Save clears. An RPC would make it atomic.
export async function saveSpots(photoId: string, spots: SpotRow[]): Promise<void> {
  let keep = supabase.from('spots').delete().eq('photo_id', photoId);
  if (spots.length > 0) {
    const inserted = await supabase
      .from('spots')
      .insert(spots.map((s) => ({ photo_id: photoId, ...s })))
      .select('id');
    fail(inserted.error);
    keep = keep.not('id', 'in', `(${inserted.data!.map((r) => r.id).join(',')})`);
  }
  fail((await keep).error);
}
