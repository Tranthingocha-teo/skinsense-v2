# Android Signed Release Runbook: v1.0.0

This runbook guides you through generating release signing credentials, registering Google OAuth fingerprints, compiling a signed production APK, and publishing to GitHub Releases.

---

## 1. Keystore & Credentials Setup (EAS)

1. Log into your Expo account:
   ```bash
   cd apps/mobile
   bun add -g eas-cli
   eas login
   ```
2. Initialize EAS project under your account:
   ```bash
   eas init
   ```
3. Generate or configure release credentials:
   ```bash
   eas credentials
   ```
   - Select **Android** -> **production** profile.
   - Choose **Generate a new Android keystore**.
   - Note down the generated **SHA-1 Fingerprint** (e.g. `AA:BB:CC:DD:...`).

---

## 2. Register SHA-1 in Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth Client ID**.
3. Select **Android**:
   - Package name: `com.skinsense.app`
   - SHA-1 certificate fingerprint: Paste the fingerprint from Step 1.
4. Click **Create**.
5. Ensure your Web Client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) is active in `apps/mobile/.env`.

---

## 3. Build Signed Release APK

SkinSense's `apps/mobile/eas.json` includes an optimized production profile:

```bash
cd apps/mobile
eas build -p android --profile production
```

When the cloud build finishes, EAS provides a direct download link for `skinsense.apk`.
Download and save this file locally.

---

## 4. Test on Physical Android Device

Before public release:
1. Uninstall any existing debug builds (`adb uninstall com.skinsense.app`).
2. Sideload and install the signed release build:
   ```bash
   adb install -r skinsense.apk
   ```
3. Complete the [docs/qa-android-checklist.md](qa-android-checklist.md).

---

## 5. Publish to GitHub Releases

1. Create a git version tag:
   ```bash
   git tag -a v1.0.0 -m "SkinSense v1.0.0 production release"
   git push origin v1.0.0
   ```
2. Create the release on GitHub:
   ```bash
   gh release create v1.0.0 skinsense.apk \
     --title "SkinSense v1.0.0" \
     --notes "Official Android Release v1.0.0: Guided camera capture, spot marking, redness trends, and routine tracking."
   ```
3. Test that the landing page download button (`/`) downloads the attached APK!
