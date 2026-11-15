# Deployment & Operations Runbook

This guide covers building and deploying SkinSense Web and Android, as well as uptime management.

---

## 1. Web Deployment (Vercel)

SkinSense Web is built with Next.js 15 (App Router).

### Fast Deployment with Vercel CLI (Recommended — No Secret Leaks)
```bash
cd apps/web
bunx vercel login                         # one-time browser OAuth
bunx vercel link --project skinsense-v2   # link Root Directory apps/web
bun run vercel:env-sync -- --dry-run      # verify required keys without printing values
bun run vercel:env-sync -- --deploy       # push 8 Production env vars & deploy --prod
```

Never commit `.env`, `.env.local`, `.env.production`, or `.vercel/` to Git, and keep secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) scoped to **Production** with Vercel **Sensitive** enabled.

### Environment Variables on Vercel
Required variables in Vercel Project **Settings** -> **Environment Variables** (`Production` scope):

| Variable | Sensitivity | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Config (`NEXT_PUBLIC_*`) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config (`NEXT_PUBLIC_*`) | Supabase publishable anon key |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Config (`NEXT_PUBLIC_*`) | Google Sign-In client ID |
| `CLOUDINARY_CLOUD_NAME` | Config | Cloudinary cloud name for product images |
| `CLOUDINARY_FOLDER` | Config | Upload folder (`skinsense/products`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sensitive** (Secret, server-only) | Admin API, auth role checks & private Storage JSON persistence |
| `CLOUDINARY_API_KEY` | **Sensitive** (Secret, server-only) | Server-side signed Cloudinary uploads |
| `CLOUDINARY_API_SECRET` | **Sensitive** (Secret, server-only) | SHA-1 upload signature secret |

### Supabase & GitHub Security Checklist (Before Going Live)
1. **Production Redirect URLs:** In Supabase Dashboard -> **Authentication** -> **URL Configuration**, set Site URL / Redirect URLs to `https://skinsense-v2-topaz.vercel.app/**`.
2. **Private Storage & RLS:** Keep the `photos` Storage bucket **Private** (`public = false`) with strict RLS policies so persisted JSON registries (`orders/`, `chat/`, `admin/`, `clinical_records/`) and clinical uploads stay server-controlled.
3. **Public GitHub / Fork PR Protection:** Keep Vercel Deployment Protection / Fork PR approval enabled so untrusted fork PRs cannot trigger Preview deployments against team secrets (or set repo visibility to Private).

### Build Command
- Framework Preset: Next.js
- Root Directory: `apps/web` (or root with monorepo build command `bun run build`)
- Install Command: `bun install`
- Build Command: `bun run build`

---

## 2. Android Release Build (APK / AAB)

SkinSense Android is built with Expo 52 and React Native 0.76.

### Option A: Local Release APK Build
Ensure Android SDK and Java 17+ are installed:
```bash
cd apps/mobile
bun expo run:android --variant release
```
The output APK will be placed in `apps/mobile/android/app/build/outputs/apk/release/`.

### Option B: EAS Build (Cloud)
```bash
cd apps/mobile
bun add -g eas-cli
eas login
eas build --platform android --profile production
```

---

## 3. Free-Tier Keep-Alive & Operations

Supabase free tier projects pause after 7 days of inactivity.

To maintain 24/7 uptime without cost:
1. Use a free uptime monitor (e.g., [cron-job.org](https://cron-job.org) or [UptimeKuma]).
2. Configure an HTTP GET ping every 6 hours to:
   ```
   https://<your-project-ref>.supabase.co/rest/v1/
   ```
   Header: `apikey: <your-anon-key>`
3. Alternatively, use GitHub Actions scheduled cron workflow (`.github/workflows/keepalive.yml`).
