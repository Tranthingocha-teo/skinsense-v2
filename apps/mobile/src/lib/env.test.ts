import { googleWebClientId, requireEnv, supabaseEnv } from './env';

describe('requireEnv', () => {
  it('returns a set value', () => {
    expect(requireEnv('X', 'abc')).toBe('abc');
  });

  it('names the variable when missing or empty', () => {
    expect(() => requireEnv('EXPO_PUBLIC_SUPABASE_URL', undefined)).toThrow(/EXPO_PUBLIC_SUPABASE_URL/);
    expect(() => requireEnv('EXPO_PUBLIC_SUPABASE_URL', '')).toThrow(/\.env\.example/);
  });
});

describe('supabaseEnv / googleWebClientId', () => {
  it('throws naming the missing variable', () => {
    // Expo's Babel preset inlines EXPO_PUBLIC_* at transform time, so jest sees them unset here.
    expect(() => supabaseEnv()).toThrow(/EXPO_PUBLIC_SUPABASE_URL/);
    expect(() => googleWebClientId()).toThrow(/EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/);
  });
});
