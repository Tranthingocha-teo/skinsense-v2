# Google OAuth Setup Guide: Web & Android

SkinSense uses Google OAuth for passwordless authentication across both Web and Android.

---

## 1. Google Cloud Console Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: e.g. `SkinSense`.
3. Go to **APIs & Services** -> **OAuth consent screen**:
   - User Type: **External**
   - App name: `SkinSense`
   - User support email: your email
   - Developer contact email: your email
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`

---

## 2. Credentials for Web (Next.js)

1. Under **Credentials**, click **Create Credentials** -> **OAuth Client ID**.
2. Application type: **Web application**.
3. Name: `SkinSense Web`.
4. Authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.vercel.app`
5. Authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**.

---

## 3. Configure Supabase Auth Provider

1. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Google**.
2. Toggle **Enable Google provider** to ON.
3. Paste the **Client ID** and **Client Secret** obtained in Step 2.
4. Click **Save**.

---

## 4. Credentials for Android (Expo / React Native)

1. In Google Cloud Console, click **Create Credentials** -> **OAuth Client ID**.
2. Application type: **Android**.
3. Name: `SkinSense Android`.
4. Package name: `com.skinsense.app` (from `apps/mobile/app.json`).
5. SHA-1 certificate fingerprint:
   - For debug builds:
     ```bash
     cd apps/mobile/android && ./gradlew signingReport
     ```
     Or keytool default debug keystore:
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - For release builds:
     Extract SHA-1 from your release keystore.
6. Click **Create**.

---

## 5. Environment Configuration

Add the Web Client ID to your application environment files:

In `apps/web/.env`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

In `apps/mobile/.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-web-client-id>.apps.googleusercontent.com
```
