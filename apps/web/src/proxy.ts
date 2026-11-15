import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";
import { resolveActorRole } from "@/lib/actor-role";

// Refreshes the Supabase session cookie on every request (Server Components
// can't write cookies) and gates /app and /seller behind a session.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return NextResponse.next({ request });
  }

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

  // Gate /app and /seller for unauthenticated visitors:
  // If not signed in and accessing either -> redirect to "/"
  if ((pathname.startsWith("/app") || pathname === "/seller" || pathname.startsWith("/seller/")) && !signedIn) {
    return redirectTo("/");
  }

  // The admin console is for admins only (the API checks again on every call).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const claims = data?.claims as { email?: string; app_metadata?: Record<string, unknown> } | undefined;
    if (!claims || resolveActorRole(claims.email ?? "", claims.app_metadata) !== "admin") {
      return redirectTo("/");
    }
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
