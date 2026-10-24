import type { Zone } from "@skinsense/domain";
import { fail } from "@/lib/routine";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "photos";
const URL_TTL_SECONDS = 600;

// `url` is absent where the photo is the labelled placeholder (the demo).
export type HistoryPhoto = { id: string; taken_at: string; spotCount: number; note: string | null; tags: string[]; url?: string };
export type PhotoTag = { id: string; label: string };
export type PhotoDetailData = Omit<HistoryPhoto, "tags"> & { storage_path: string; tags: PhotoTag[]; readings: { zone: Zone; redness: number }[] };

// Every Photo of the signed-in user (RLS), newest first, with its spot count, Note, Tags and a short-lived signed URL.
export async function loadHistory(): Promise<HistoryPhoto[]> {
  const supabase = createClient();
  const photos = await supabase.from("photos").select("id,taken_at,storage_path,note,spots(count),photo_tags(label)").order("taken_at", { ascending: false });
  fail(photos.error);
  if (photos.data!.length === 0) return [];
  // ponytail: full-size JPEGs as thumbnails (lazy-loaded); Supabase image transforms need a paid plan.
  const signed = await supabase.storage.from(BUCKET).createSignedUrls(photos.data!.map((p) => p.storage_path), URL_TTL_SECONDS);
  fail(signed.error);
  return photos.data!.map((p, i) => ({
    id: p.id,
    taken_at: p.taken_at,
    spotCount: p.spots[0]?.count ?? 0,
    note: p.note,
    tags: p.photo_tags.map((t) => t.label),
    url: signed.data![i].signedUrl ?? undefined,
  }));
}

export async function loadPhotoDetail(id: string): Promise<PhotoDetailData> {
  const supabase = createClient();
  const [photo, spots, readings] = await Promise.all([
    supabase.from("photos").select("id,taken_at,storage_path,note,photo_tags(id,label)").eq("id", id).single(),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("photo_id", id),
    supabase.from("zone_readings").select("zone,redness").eq("photo_id", id),
  ]);
  fail(photo.error);
  fail(spots.error);
  fail(readings.error);
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(photo.data!.storage_path, URL_TTL_SECONDS);
  fail(signed.error);
  const { photo_tags, ...row } = photo.data!;
  return { ...row, tags: photo_tags, spotCount: spots.count ?? 0, readings: readings.data as PhotoDetailData["readings"], url: signed.data!.signedUrl };
}

// Callers validate with noteError / tagError (domain) first; values are stored trimmed, an empty Note as null.
export async function saveNote(photoId: string, note: string): Promise<void> {
  fail((await createClient().from("photos").update({ note: note.trim() || null }).eq("id", photoId)).error);
}

export async function addTag(photoId: string, label: string): Promise<PhotoTag> {
  const tag = await createClient().from("photo_tags").insert({ photo_id: photoId, label: label.trim() }).select("id,label").single();
  fail(tag.error);
  return tag.data!;
}

export async function removeTag(tagId: string): Promise<void> {
  fail((await createClient().from("photo_tags").delete().eq("id", tagId)).error);
}

// Storage object first: a failure leaves the row, so the Photo is still listed and Delete can be retried;
// the reverse order could leave a private image nobody can see or remove. Spots, ZoneReadings and Tags go
// with the row through their ON DELETE CASCADE foreign keys (schema.ts).
export async function deletePhoto(photo: { id: string; storage_path: string }): Promise<void> {
  const supabase = createClient();
  fail((await supabase.storage.from(BUCKET).remove([photo.storage_path])).error);
  fail((await supabase.from("photos").delete().eq("id", photo.id)).error);
}
