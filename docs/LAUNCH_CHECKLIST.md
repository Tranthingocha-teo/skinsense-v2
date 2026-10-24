# Recipient 100% Production Launch Checklist

This checklist is the ultimate step-by-step master plan to take your fork from clone to a fully deployed, production-grade product.

---

## Phase 1: Local Verification & Environment Setup
- [ ] **1.1 Clone & Dependencies**: Clone `https://github.com/Tranthingocha-teo/skinsense-v2.git` and run `bun install`.
- [ ] **1.2 Health Check**: Run `bun run doctor` to verify Node.js, Bun, and git tools.
- [ ] **1.3 Automated Tests**: Run `bun run test` (all 300+ unit tests across domain, web, and mobile must pass).
- [ ] **1.4 Monorepo Typecheck**: Run `bun run typecheck` (all 5 workspaces must report 0 errors).
- [ ] **1.5 Local Demo Run**: Run `cd apps/web && bun dev` and test `/demo` routes in your browser.

---

## Phase 2: Supabase Backend Provisioning
- [ ] **2.1 Create Supabase Project**: Create a new project at [database.new](https://database.new).
- [ ] **2.2 Apply Migrations**: In the SQL Editor, apply `0000_init.sql` through `0004_notes_and_tags.sql` from `packages/domain/drizzle/`.
- [ ] **2.3 Create Private Storage Bucket**: Create a private bucket named `photos` and verify the RLS storage owner policy.
- [ ] **2.4 Deploy Edge Function**: Deploy `supabase/functions/delete-account` using the Supabase CLI (`supabase functions deploy delete-account`).
- [ ] **2.5 Configure Env Files**:
  - Create `apps/web/.env.local` using `apps/web/.env.example`.
  - Create `apps/mobile/.env` using `apps/mobile/.env.example`.

---

## Phase 3: Google Cloud OAuth 2.0
- [ ] **3.1 OAuth Consent Screen**: Configure OAuth consent screen in Google Cloud Console.
- [ ] **3.2 Web OAuth Client**: Create Web client ID and secret; add them to Supabase Auth -> Providers -> Google.
- [ ] **3.3 Android OAuth Client**: Create Android client ID with package name `com.skinsense.app` and your keystore's SHA-1.
- [ ] **3.4 Test Sign-In**: Verify Google sign-in works smoothly on web.

---

## Phase 4: Web Deployment (Vercel)
- [ ] **4.1 Deploy Web Project**: Connect repository to Vercel (Root directory: `apps/web`).
- [ ] **4.2 Configure Vercel Env**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **4.3 Verify Live Deployment**: Check that landing page (`/`), case study (`/case-study`), and privacy policy (`/privacy`) return HTTP 200.
- [ ] **4.4 Setup Keep-Alive Cron**: Verify daily ping `/api/cron/ping` keeps the free Supabase database active.
- [ ] **4.5 Run Lighthouse**: Execute `bun run audit:lighthouse` against your deployed web URL.

---

## Phase 5: Android Build, QA & Release
- [ ] **5.1 Setup EAS**: Run `cd apps/mobile && eas init` to link your Expo account.
- [ ] **5.2 Generate Keystore**: Run `eas credentials` to create your production release keystore.
- [ ] **5.3 Build Release APK**: Execute `eas build -p android --profile production` to generate `skinsense.apk`.
- [ ] **5.4 Physical Device QA**: Install `skinsense.apk` on a real phone and run through [docs/qa-android-checklist.md](qa-android-checklist.md).
- [ ] **5.5 Publish v1.0.0**: Create GitHub Release `v1.0.0` with `skinsense.apk` attached on [GitHub Releases](https://github.com/Tranthingocha-teo/skinsense-v2/releases).
