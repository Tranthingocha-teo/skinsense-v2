# Supabase with Expo and Next.js (research 2026-09-11)

One Supabase project serves `apps/mobile` (Expo) and `apps/web` (Next.js). Google sign-in on both via `signInWithIdToken` (see `auth-google-idtoken.md`).

## Expo session persistence

- Use the Supabase `LargeSecureStore` pattern: generate an AES-256 key, keep the key in `expo-secure-store`, encrypt the session and store the ciphertext in AsyncStorage. Reason: sessions exceed SecureStore's 2048-byte value limit and get truncated silently.
- `autoRefreshToken: true`; on `AppState` change call `supabase.auth.startAutoRefresh()` when active and `stopAutoRefresh()` when backgrounded.
- Keep the default `lock: processLock` for React Native to avoid parallel refresh races.

## Photo upload from Expo

- Read the file and upload `await (await fetch(uri)).arrayBuffer()` with `contentType: 'image/jpeg'`. Base64 + `decode()` has produced corrupted objects on Android (issues #7252, #7222); FormData works but is less reliable.
- TUS resumable uploads stall around 6 MB (storage #563); photos here are ~1–2 MB, use the plain upload.
- Compress on device before upload (target ≤2 MB, keep enough resolution for zone analysis; analysis runs before compression).

## Storage layout and RLS

- Bucket `photos`, private. Object path: `${auth.uid()}/${entryId}.jpg`.
- Policy (insert/select/delete): `bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text`.
- Reads via `createSignedUrl(path, ttl)`; never expose public URLs.
- Tables carry `user_id uuid default auth.uid()` with RLS `user_id = auth.uid()` on all operations.

## Next.js (`@supabase/ssr`)

- `createBrowserClient` / `createServerClient` keep the session in cookies; nothing extra after `signInWithIdToken`.
- Server Components cannot write cookies: add the middleware that refreshes the token on each request.
- Never let a CDN cache a response carrying `Set-Cookie` (session leak between users).

## Delete account

- Edge Function with the service-role key: list and remove the user's storage objects first, then `auth.admin.deleteUser(id)`. Deleting a user that still owns objects fails. Do not do this via a client-side RPC.

## Free-tier limits (official pricing pages, accessed 2026-09-11)

| Item | Free plan |
|---|---|
| Database | 500 MB |
| Storage | 1 GB, egress 5 GB/month |
| Auth | 50,000 MAU; Google provider costs nothing extra |
| Edge Functions | 500,000 invocations/month |
| Pause | project pauses after 7 days without activity |

- Avoid the pause with a scheduled ping (Vercel Cron calling a trivial query) or by using the app more often than weekly.
- Google OAuth consent screen: publish to **Production** with only `email`/`profile` scopes → no Google verification required, no 7-day token expiry (Testing mode caps 100 users and expires grants after 7 days).

## Sources

- https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-expo-react-native.mdx
- https://supabase.com/blog/react-native-storage
- https://github.com/supabase/supabase/issues/7252
- https://github.com/supabase/storage/issues/563
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/managing-user-data
- https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/ (secondary; confirm on supabase.com/pricing)
- https://support.google.com/cloud/answer/15549945 (app audience)
- https://support.google.com/cloud/answer/13464323 (when verification is not needed)
