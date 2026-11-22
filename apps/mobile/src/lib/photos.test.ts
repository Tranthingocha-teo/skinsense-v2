import { ZONES } from '@skinsense/domain';

import { uploadImageRemote } from './api';
import { savePhoto } from './photos';
import { supabase } from './supabase';

const CLOUD_URL = 'https://res.cloudinary.com/demo/image/upload/v1/skin-photos/abc.jpg';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'photo-1' }));
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: class {
    uri = 'file:///cache/photo-1.jpg';
    exists = false;
    create() {}
    write() {}
    delete() {}
  },
}));
jest.mock('./api', () => ({ uploadImageRemote: jest.fn() }));
jest.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn(() => ({ upload: jest.fn(), remove: jest.fn() })) },
  },
}));

const sb = supabase as unknown as { auth: { getSession: jest.Mock }; from: jest.Mock; storage: { from: jest.Mock } };
const upload = uploadImageRemote as jest.Mock;

const zone = { redness: 1, unevenness: 1, pixelCount: 10 };
const input = {
  image: new ArrayBuffer(8),
  brightness: 0.5,
  awbLocked: true,
  readings: Object.fromEntries(ZONES.map((z) => [z, zone])) as never,
};

function tables() {
  const photoInsert = jest.fn().mockResolvedValue({ error: null });
  const readingInsert = jest.fn().mockResolvedValue({ error: null });
  sb.from.mockImplementation((table: string) => ({
    insert: table === 'photos' ? photoInsert : readingInsert,
    delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
  }));
  return { photoInsert, readingInsert };
}

beforeEach(() => {
  jest.clearAllMocks();
  sb.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
});

describe('savePhoto (face photo on Cloudinary)', () => {
  it('uploads to Cloudinary folder skin-photos and stores the https link as storage_path', async () => {
    const { photoInsert, readingInsert } = tables();
    upload.mockResolvedValue({ ok: true, url: CLOUD_URL });

    const id = await savePhoto(input);

    expect(id).toBe('photo-1');
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ folder: 'skin-photos', mimeType: 'image/jpeg' }));
    expect(photoInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'photo-1', storage_path: CLOUD_URL }));
    expect(readingInsert).toHaveBeenCalledTimes(1);
    expect(sb.storage.from).not.toHaveBeenCalled(); // nothing goes to Supabase Storage any more
  });

  it('writes no Photo row when the upload fails', async () => {
    const { photoInsert, readingInsert } = tables();
    upload.mockResolvedValue({ ok: false, error: 'HTTP 503' });

    await expect(savePhoto(input)).rejects.toThrow('HTTP 503');
    expect(photoInsert).not.toHaveBeenCalled();
    expect(readingInsert).not.toHaveBeenCalled();
  });

  it('rejects when nobody is signed in', async () => {
    sb.auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(savePhoto(input)).rejects.toThrow('not signed in');
    expect(upload).not.toHaveBeenCalled();
  });
});
