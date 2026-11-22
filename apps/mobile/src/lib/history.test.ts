import { uploadImageRemote } from './api';
import { deletePhoto, loadHistory, uploadPhotoToCloudinary } from './history';
import { supabase } from './supabase';

const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/skin-photos/new.jpg';
const LEGACY = 'user-1/old.jpg';

const mockDownload = jest.fn(async (): Promise<{ uri: string }> => ({ uri: 'file:///cache/clinical.jpg' }));
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: class {
    static downloadFileAsync() {
      return mockDownload();
    }
    exists = false;
    delete() {}
  },
}));
jest.mock('./api', () => ({ uploadImageRemote: jest.fn() }));
jest.mock('./supabase', () => ({ supabase: { from: jest.fn(), storage: { from: jest.fn() } } }));

const sb = supabase as unknown as { from: jest.Mock; storage: { from: jest.Mock } };
const bucket = { createSignedUrls: jest.fn(), createSignedUrl: jest.fn(), remove: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  sb.storage.from.mockReturnValue(bucket);
  bucket.createSignedUrls.mockResolvedValue({ data: [], error: null });
  bucket.remove.mockResolvedValue({ error: null });
});

function row(id: string, storage_path: string) {
  return { id, taken_at: '2026-11-20T00:00:00Z', storage_path, note: null, spots: [{ count: 0 }], photo_tags: [] };
}

describe('loadHistory with Cloudinary links and legacy paths', () => {
  it('uses https links as they are and signs only the legacy Supabase paths, keeping order', async () => {
    sb.from.mockReturnValue({
      select: () => ({ order: () => Promise.resolve({ data: [row('a', CLOUD), row('b', LEGACY)], error: null }) }),
    });
    bucket.createSignedUrls.mockResolvedValue({ data: [{ signedUrl: 'https://supabase/signed-b' }], error: null });

    const list = await loadHistory();

    expect(bucket.createSignedUrls).toHaveBeenCalledWith([LEGACY], expect.any(Number));
    expect(list.map((p) => [p.id, p.url])).toEqual([
      ['a', CLOUD],
      ['b', 'https://supabase/signed-b'],
    ]);
  });

  it('does not call Supabase Storage at all when every photo is on Cloudinary', async () => {
    sb.from.mockReturnValue({
      select: () => ({ order: () => Promise.resolve({ data: [row('a', CLOUD)], error: null }) }),
    });
    const list = await loadHistory();
    expect(bucket.createSignedUrls).not.toHaveBeenCalled();
    expect(list[0].url).toBe(CLOUD);
  });
});

describe('deletePhoto', () => {
  function rowDelete() {
    const eq = jest.fn().mockResolvedValue({ error: null });
    sb.from.mockReturnValue({ delete: () => ({ eq }) });
    return eq;
  }

  it('deletes only the row for a Cloudinary photo (no Supabase Storage call)', async () => {
    const eq = rowDelete();
    await deletePhoto({ id: 'a', storage_path: CLOUD });
    expect(bucket.remove).not.toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'a');
  });

  it('removes the Supabase object first for a legacy photo', async () => {
    const eq = rowDelete();
    await deletePhoto({ id: 'b', storage_path: LEGACY });
    expect(bucket.remove).toHaveBeenCalledWith([LEGACY]);
    expect(eq).toHaveBeenCalledWith('id', 'b');
  });

  it('keeps the row when removing the legacy object fails', async () => {
    const eq = rowDelete();
    bucket.remove.mockResolvedValue({ error: { message: 'boom' } });
    await expect(deletePhoto({ id: 'b', storage_path: LEGACY })).rejects.toThrow();
    expect(eq).not.toHaveBeenCalled();
  });
});

describe('uploadPhotoToCloudinary (clinical export)', () => {
  it('returns an existing Cloudinary link without downloading or uploading again', async () => {
    expect(await uploadPhotoToCloudinary(CLOUD, 'a')).toBe(CLOUD);
    expect(uploadImageRemote).not.toHaveBeenCalled();
    expect(bucket.createSignedUrl).not.toHaveBeenCalled();
  });

  it('downloads a legacy photo, uploads it to folder clinical and returns the new link', async () => {
    bucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://supabase/signed' }, error: null });
    (uploadImageRemote as jest.Mock).mockResolvedValue({ ok: true, url: CLOUD });
    expect(await uploadPhotoToCloudinary(LEGACY, 'b')).toBe(CLOUD);
    expect(uploadImageRemote).toHaveBeenCalledWith(expect.objectContaining({ folder: 'clinical' }));
  });

  it('returns undefined when the upload fails so the record can still be sent', async () => {
    bucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://supabase/signed' }, error: null });
    (uploadImageRemote as jest.Mock).mockResolvedValue({ ok: false, error: 'x' });
    expect(await uploadPhotoToCloudinary(LEGACY, 'b')).toBeUndefined();
  });
});
