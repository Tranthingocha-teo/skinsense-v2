import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Cookie } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const APP_URL = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3000");

export const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Google's ID-token flow can't be driven by a browser test, so a dedicated
// test account signs in through a magic-link token instead; @supabase/ssr's own
// cookie writer produces exactly the cookies the app's browser client reads.
//
// Specs that share an account run in parallel workers, and each generateLink
// replaces the account's previous token, so a verify can lose that race
// ("Email link is invalid or has expired"): retry with a fresh link.
export async function signedInCookies(email: string): Promise<{ cookies: Cookie[]; userId: string }> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await signInOnce(email);
    } catch (error) {
      if (attempt >= 5) throw error;
      // Supabase limits magic-link verifications per IP; back off instead of burning the retries.
      const rateLimited = /rate limit/i.test(error instanceof Error ? error.message : String(error));
      await new Promise((resolve) => setTimeout(resolve, rateLimited ? 15_000 : 200 + Math.random() * 800));
    }
  }
}

async function signInOnce(email: string): Promise<{ cookies: Cookie[]; userId: string }> {
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;

  const jar: Cookie[] = [];
  const ssr = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.map(({ name, value }) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) {
          jar.push({ name, value, domain: APP_URL.hostname, path: "/", expires: -1, httpOnly: false, secure: APP_URL.protocol === "https:", sameSite: "Lax" });
        }
      },
    },
  });
  const session = await ssr.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
  if (session.error) throw session.error;
  return { cookies: jar, userId: link.data.user.id };
}
