import { File, Paths } from 'expo-file-system';

import type { Zone } from '@skinsense/domain';

import { uploadImageRemote } from './api';
import { fail } from './routine';
import { supabase } from './supabase';

// Same contract as apps/web/src/lib/history.ts; only the client differs.
const BUCKET = 'photos';
const URL_TTL_SECONDS = 600;

export type HistoryPhoto = { id: string; taken_at: string; spotCount: number; note: string | null; tags: string[]; url?: string };
export type PhotoTag = { id: string; label: string };
export type PhotoDetailData = Omit<HistoryPhoto, 'tags'> & { storage_path: string; tags: PhotoTag[]; readings: { zone: Zone; redness: number }[] };

// Every Photo of the signed-in user (RLS), newest first, with its spot count, Note, Tags and a short-lived signed URL.
const isHttp = (path: string) => /^https?:\/\//.test(path);

// Link Cloudinary (https) dùng nguyên; đường dẫn cũ trong bucket Supabase thì ký URL tạm.
async function signedUrls(paths: string[]): Promise<(string | undefined)[]> {
  const legacy = paths.filter((p) => !isHttp(p));
  const map = new Map<string, string | undefined>();
  if (legacy.length > 0) {
    const signed = await supabase.storage.from(BUCKET).createSignedUrls(legacy, URL_TTL_SECONDS);
    fail(signed.error);
    legacy.forEach((p, i) => map.set(p, signed.data![i].signedUrl ?? undefined));
  }
  return paths.map((p) => (isHttp(p) ? p : map.get(p)));
}

export async function loadHistory(): Promise<HistoryPhoto[]> {
  const photos = await supabase.from('photos').select('id,taken_at,storage_path,note,spots(count),photo_tags(label)').order('taken_at', { ascending: false });
  fail(photos.error);
  if (photos.data!.length === 0) return [];
  // ponytail: full-size JPEGs as thumbnails (expo-image caches them); Supabase image transforms need a paid plan.
  const signed = await signedUrls(photos.data!.map((p) => p.storage_path));
  return photos.data!.map((p, i) => ({
    id: p.id,
    taken_at: p.taken_at,
    spotCount: p.spots[0]?.count ?? 0,
    note: p.note,
    tags: p.photo_tags.map((t: { label: string }) => t.label),
    url: signed[i],
  }));
}

export async function loadPhotoDetail(id: string): Promise<PhotoDetailData> {
  const [photo, spots, readings] = await Promise.all([
    supabase.from('photos').select('id,taken_at,storage_path,note,photo_tags(id,label)').eq('id', id).single(),
    supabase.from('spots').select('id', { count: 'exact', head: true }).eq('photo_id', id),
    supabase.from('zone_readings').select('zone,redness').eq('photo_id', id),
  ]);
  fail(photo.error);
  fail(spots.error);
  fail(readings.error);
  const [detailUrl] = await signedUrls([photo.data!.storage_path]);
  const { photo_tags, ...row } = photo.data!;
  return { ...row, tags: photo_tags, spotCount: spots.count ?? 0, readings: readings.data as PhotoDetailData['readings'], url: detailUrl };
}

// Callers validate with noteError / tagError (domain) first; values are stored trimmed, an empty Note as null.
export async function saveNote(photoId: string, note: string): Promise<void> {
  fail((await supabase.from('photos').update({ note: note.trim() || null }).eq('id', photoId)).error);
}

export async function addTag(photoId: string, label: string): Promise<PhotoTag> {
  const tag = await supabase.from('photo_tags').insert({ photo_id: photoId, label: label.trim() }).select('id,label').single();
  fail(tag.error);
  return tag.data!;
}

export async function removeTag(tagId: string): Promise<void> {
  fail((await supabase.from('photo_tags').delete().eq('id', tagId)).error);
}

// Storage object first: a failure leaves the row, so the Photo is still listed and Delete can be retried;
// the reverse order could leave a private image nobody can see or remove. Spots, ZoneReadings and Tags go
// with the row through their ON DELETE CASCADE foreign keys (schema.ts). Spot marking's cached copy goes too.
export async function deletePhoto(photo: { id: string; storage_path: string }): Promise<void> {
  // Ảnh trên Cloudinary (link https) chỉ xóa dòng dữ liệu: xóa ảnh phía Cloudinary cần route ở web, chưa có.
  if (!isHttp(photo.storage_path)) fail((await supabase.storage.from(BUCKET).remove([photo.storage_path])).error);
  fail((await supabase.from('photos').delete().eq('id', photo.id)).error);
  const cached = new File(Paths.cache, `${photo.id}.jpg`);
  if (cached.exists) cached.delete();
}

// Ảnh da nằm trong bucket riêng của Supabase: tải bản có chữ ký về cache rồi đẩy lên Cloudinary,
// trả link công khai để hồ sơ bệnh án hiển thị cho bác sĩ. Thất bại trả undefined (hồ sơ vẫn gửi được).
export async function uploadPhotoToCloudinary(storagePath: string, photoId: string): Promise<string | undefined> {
  try {
    if (isHttp(storagePath)) return storagePath; // đã nằm trên Cloudinary
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, URL_TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) return undefined;
    const local = await File.downloadFileAsync(signed.data.signedUrl, new File(Paths.cache, `clinical-${photoId}.jpg`), { idempotent: true });
    const up = await uploadImageRemote({ uri: local.uri, mimeType: 'image/jpeg', fileName: `skin-${photoId}.jpg`, folder: 'clinical' });
    return up.ok ? up.url : undefined;
  } catch {
    return undefined;
  }
}
