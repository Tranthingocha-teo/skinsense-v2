// One place that reads required environment variables. Callers pass the value
// read with a literal `process.env.NAME`: Next only inlines NEXT_PUBLIC_* into
// the browser bundle when the access is written out in full, never via env[name].
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy apps/web/.env.example to apps/web/.env.local and fill it in (or open /demo, which needs no setup).`,
    );
  }
  return value;
}

export function supabaseEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function googleWebClientId() {
  return requireEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID);
}
