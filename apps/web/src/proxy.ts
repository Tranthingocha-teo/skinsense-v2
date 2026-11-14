import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";

// Refreshes the Supabase session cookie on every request (Server Components
// can't write cookies) and gates /app behind a session.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          // A response carrying Set-Cookie must never be cached by a CDN.
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  // Gate ONLY /app for unauthenticated visitors:
  // If not signed in and accessing /app -> redirect to "/"
  if (pathname.startsWith("/app") && !signedIn) {
    return redirectTo("/");
  }

  return response;

  // A redirect must still carry the cookies getClaims() just rotated.
  function redirectTo(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url), { headers: response.headers });
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
