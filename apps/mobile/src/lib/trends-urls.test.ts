import { signedPhotoUrls } from './trends';
import { supabase } from './supabase';

jest.mock('./demo', () => ({ getMobileDemoData: jest.fn() }));
jest.mock('./supabase', () => ({ supabase: { storage: { from: jest.fn() } } }));

const createSignedUrls = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls });
});

describe('signedPhotoUrls', () => {
  it('passes Cloudinary links through and signs only legacy paths, keeping order', async () => {
    createSignedUrls.mockResolvedValue({ data: [{ signedUrl: 'https://supabase/signed' }], error: null });
    const out = await signedPhotoUrls(['https://res.cloudinary.com/a.jpg', 'user/old.jpg', 'https://res.cloudinary.com/b.jpg']);
    expect(createSignedUrls).toHaveBeenCalledWith(['user/old.jpg'], 600);
    expect(out).toEqual(['https://res.cloudinary.com/a.jpg', 'https://supabase/signed', 'https://res.cloudinary.com/b.jpg']);
  });

  it('makes no Storage call when there are only Cloudinary links', async () => {
    expect(await signedPhotoUrls(['https://res.cloudinary.com/a.jpg'])).toEqual(['https://res.cloudinary.com/a.jpg']);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });
});
