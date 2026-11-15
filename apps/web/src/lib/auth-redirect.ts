/**
 * Where to send the browser after the OAuth callback. Only same-site paths are allowed: `next`
 * comes from the URL, and `new URL("https://evil.example", origin)` would leave the site.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

/**
 * Supabase falls back to the Site URL (the landing page) when a redirect_to isn't on its allow list,
 * e.g. from a preview deployment. A `?code=` arriving at "/" is the OAuth code meant for
 * /auth/callback; forward it there (with every other param) so the sign-in still completes.
 */
export function strayOAuthCodeRedirect(url: URL): URL | null {
  if (url.pathname !== "/" || !url.searchParams.get("code")) return null;
  const target = new URL("/auth/callback", url.origin);
  url.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return target;
}

/** The landing URL that tells the visitor the sign-in failed (shown by AuthErrorNotice). */
export function authErrorUrl(origin: string, reason: string): URL {
  const url = new URL("/", origin);
  url.searchParams.set("auth_error", reason.slice(0, 120));
  return url;
}
