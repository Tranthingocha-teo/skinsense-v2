# Google sign-in via ID token (research 2026-09-11)

Decision: Google is the only login method on web and Android. Both platforms obtain a Google ID token client-side and call `supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })`. No browser-redirect OAuth anywhere.

## Why not redirect OAuth (`signInWithOAuth`)

- Installed iOS PWA (standalone mode) does not share storage with Safari; the redirect completes in Safari and the PWA never receives the session (Supabase discussion #12227, issue #15245). This decision was made while the app was still a PWA; the iOS target is now the web app in Safari, where a redirect would work, but the token flow is kept for one consistent path and no full-page redirect.
- On native, `expo-auth-session` bounces through the system browser and a deep link back; slower and more fragile than the native Google SDK.
- Google blocks OAuth inside embedded WebViews (`disallowed_useragent`, since 2017); a standalone PWA is Safari-engine and not blocked — the problem was only the return redirect.

## Web (`apps/web`)

- Google Identity Services (GIS) button or One Tap → `credential` (JWT ID token) → `signInWithIdToken`.
- Generate a nonce, pass the raw nonce to Supabase and its SHA-256 to GIS (verify current requirement in Supabase docs).
- Needs a **Web** OAuth client ID with the site origins (Vercel domain + localhost) in "Authorized JavaScript origins".

## Android (`apps/mobile`)

- `@react-native-google-signin/google-signin` (native SDK, requires a dev build; not Expo Go) → `idToken` → `signInWithIdToken`.
- Needs an **Android** OAuth client ID with package name + SHA-1 of the signing certificate (debug keystore for local builds, EAS-managed keystore for EAS builds — register both SHA-1s), and the **Web** client ID passed as `webClientId` so the ID token audience matches Supabase's configured client.
- Supabase Dashboard → Auth → Google: add the Web client ID (and Android client ID under "Authorized Client IDs") and enable "Skip nonce check" only if the native SDK cannot supply one (verify in docs).

## Consent screen

- Publish to Production with `email` + `profile` scopes only: no verification, no 100-user cap, no 7-day grant expiry. Privacy policy URL required for the consent screen: point it at the web app's privacy page.

## Sources

- https://github.com/orgs/supabase/discussions/12227
- https://github.com/supabase/supabase/issues/15245
- https://developers.googleblog.com/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/
- https://developers.google.com/identity/protocols/oauth2/native-app
- https://supabase.com/docs/guides/auth/social-login/auth-google (verify nonce and native sections)
- https://support.google.com/cloud/answer/13464323
