import { LargeSecureStore } from './large-secure-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => crypto.getRandomValues(new Uint8Array(n)),
}));
jest.mock('expo-secure-store', () => {
  const keys = new Map<string, string>();
  return {
    getItemAsync: async (k: string) => keys.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void keys.set(k, v),
    deleteItemAsync: async (k: string) => void keys.delete(k),
  };
});

describe('LargeSecureStore', () => {
  it('round-trips a value larger than SecureStore\'s 2048-byte limit', async () => {
    const store = new LargeSecureStore();
    const session = JSON.stringify({ access_token: 'x'.repeat(3000), user: { email: 'a@b.c' } });
    await store.setItem('session', session);
    expect(await store.getItem('session')).toBe(session);
    await store.removeItem('session');
    expect(await store.getItem('session')).toBeNull();
  });
});
