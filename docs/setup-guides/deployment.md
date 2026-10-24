# Deployment & Operations Runbook

This guide covers building and deploying SkinSense Web and Android, as well as uptime management.

---

## 1. Web Deployment (Vercel)

SkinSense Web is built with Next.js 15 (App Router).

### Fast Deployment with Vercel CLI
```bash
cd apps/web
bun add -g vercel
vercel
```

### Environment Variables on Vercel
In Vercel Dashboard -> **Settings** -> **Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJ...`

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
