import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/env";

export async function createClient() {
  const store = await cookies();
  const { url, anonKey } = supabaseEnv();
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(cookiesToSet) {
          // Server Components can't write cookies; proxy.ts does the refresh.
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}
