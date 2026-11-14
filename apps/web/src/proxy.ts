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

  // Gate ONLY /app: The home landing page ("/") is ALWAYS accessible so users can click "Trang chủ" from any portal!
  if (pathname.startsWith("/app")) {
    if (!signedIn) return redirectTo("/");

    const claims = data.claims as Record<string, any>;
    const email = ((claims?.email as string) || "").trim().toLowerCase();
    const meta = (claims?.user_metadata || {}) as Record<string, any>;
    const role = meta.role;
    const status = meta.status;

    const isDoctorEmail =
      email.includes("doctor") ||
      email.includes("bacsi") ||
      email.startsWith("dr.") ||
      email.includes("dr_") ||
      email.includes("dr-") ||
      email === "bacsi.hoa@skinsense.vn" ||
      email === "dr.ha@gmail.com" ||
      email === "dr.lananh@skinsense.vn" ||
      email === "thuydung.doctor@gmail.com";

    const isSpecialist = role === "specialist" || isDoctorEmail;
    const isAdmin = email === "hattn.23itb@vku.udn.vn" || role === "admin";
    const isShop = role === "shop";

    // If Doctor / Specialist visits "/app" -> ALWAYS open Doctor Portal /specialist!
    if (isSpecialist) {
      return redirectTo(status === "pending" ? "/specialist?status=pending" : "/specialist");
    }

    // If Admin visits "/app" -> ALWAYS open Admin Dashboard /admin!
    if (isAdmin) {
      return redirectTo("/admin");
    }

    // If Shop visits "/app" -> ALWAYS open Shop Portal /shop!
    if (isShop) {
      return redirectTo("/shop");
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
