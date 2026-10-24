// One place that reads required environment variables. Callers pass the value
// read with a literal `process.env.EXPO_PUBLIC_*`: Expo's Babel plugin only
// inlines the full literal access, never env[name].
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy apps/mobile/.env.example to apps/mobile/.env and fill it in, then restart Metro.`,
    );
  }
  return value;
}

export function supabaseEnv() {
  return {
    url: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function googleWebClientId() {
  return requireEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
}
