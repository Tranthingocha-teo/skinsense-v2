import { ZONES, type Zone, type ZoneReadings } from "@skinsense/domain";
import { fail } from "@/lib/routine";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "photos";
const GHOST_URL_TTL_SECONDS = 600;

// The previous photo, as a short-lived signed URL, for the capture ghost overlay.
export async function latestPhotoUrl(): Promise<string | null> {
  const supabase = createClient();
  const latest = await supabase
    .from("photos")
    .select("storage_path")
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  fail(latest.error);
  if (!latest.data) return null;
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(latest.data.storage_path, GHOST_URL_TTL_SECONDS);
  fail(signed.error);
  return signed.data!.signedUrl;
}

// Image first (arrayBuffer, never base64), then the Photo row, then one
// ZoneReading per zone — readings are computed once at capture time and never
// recomputed (spec.md "Entities"). Path `${auth.uid()}/${photoId}.jpg` is what
// the storage owner-folder policy checks.
export async function savePhoto(input: {
  image: Blob;
  brightness: number;
  awbLocked: boolean;
  readings: ZoneReadings;
}): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new Error("not signed in");
  const id = crypto.randomUUID();
  const storagePath = `${userId}/${id}.jpg`;

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, await input.image.arrayBuffer(), { contentType: "image/jpeg" });
  fail(upload.error);

  // A Photo row without its readings would read as a valid capture everywhere
  // else; roll both the row (cascade) and the object back if either insert fails.
  try {
    const photo = await supabase
      .from("photos")
      .insert({ id, storage_path: storagePath, brightness: input.brightness, awb_locked: input.awbLocked });
    fail(photo.error);
    const readings = await supabase.from("zone_readings").insert(
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
    await supabase.from("photos").delete().eq("id", id);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  return id;
}

export type SpotRow = { x: number; y: number; zone: Zone };

// The stored JPEG as a same-origin object URL — downloaded, not a signed URL,
// so it can be drawn to a canvas for landmark detection without CORS.
export async function loadPhoto(id: string): Promise<string> {
  const supabase = createClient();
  const photo = await supabase.from("photos").select("storage_path").eq("id", id).single();
  fail(photo.error);
  const file = await supabase.storage.from(BUCKET).download(photo.data!.storage_path);
  fail(file.error);
  return URL.createObjectURL(file.data!);
}

export async function loadSpots(photoId: string): Promise<SpotRow[]> {
  const { data, error } = await createClient().from("spots").select("x,y,zone").eq("photo_id", photoId);
  fail(error);
  return data as SpotRow[];
}

// One Save replaces the photo's whole spot set; coordinates are face-relative
// (domain's toFaceRelative) with the zone assigned at mark time (schema.ts).
// ponytail: insert the new set first, then drop the old rows, so a failure
// between the two keeps the old set instead of losing it; a failed delete leaves
// duplicates that the next Save clears. An RPC would make it atomic.
export async function saveSpots(photoId: string, spots: SpotRow[]): Promise<void> {
  const supabase = createClient();
  let keep = supabase.from("spots").delete().eq("photo_id", photoId);
  if (spots.length > 0) {
    const inserted = await supabase
      .from("spots")
      .insert(spots.map((s) => ({ photo_id: photoId, ...s })))
      .select("id");
    fail(inserted.error);
    keep = keep.not("id", "in", `(${inserted.data!.map((r) => r.id).join(",")})`);
  }
  fail((await keep).error);
}
