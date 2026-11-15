import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";
import { resolveActorRole } from "@/lib/actor-role";
import { strayOAuthCodeRedirect } from "@/lib/auth-redirect";

// Refreshes the Supabase session cookie on every request (Server Components
// can't write cookies) and gates /app and /seller behind a session.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // An OAuth code that Supabase sent to the Site URL instead of /auth/callback.
  const stray = strayOAuthCodeRedirect(new URL(request.url));
  if (stray) return NextResponse.redirect(stray);

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

  // The Seller Center is for approved shops (and admins); everyone else may only apply at
  // /seller/register. It used to open for any signed-in account, customers included.
  if ((pathname === "/seller" || pathname.startsWith("/seller/")) && pathname !== "/seller/register") {
    const role = await currentRole();
    if (role !== "shop" && role !== "admin") {
      return redirectTo("/seller/register");
    }
  }

  // The admin console is for admins only (the API checks again on every call).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if ((await currentRole()) !== "admin") {
      return redirectTo("/");
    }
  }

  return response;

  // The role from the auth server, not from the JWT: the token keeps the app_metadata it was
  // issued with for up to an hour, so a shop the admin had just approved was still sent to
  // /seller/register (and a locked one still got in). Only the gated pages pay this round trip.
  async function currentRole() {
    if (!signedIn) return "customer";
    const { data: fresh } = await supabase.auth.getUser();
    const user = fresh?.user;
    if (!user) return "customer";
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const email = user.email ?? "";
    if (appMeta.status === "suspended" && resolveActorRole(email, undefined) !== "admin") return "customer";
    return resolveActorRole(email, appMeta);
  }

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
