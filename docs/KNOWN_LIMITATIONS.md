# Known Limitations & Dependency Architecture

This document records deliberate design boundaries, out-of-scope features, and critical dependency configurations for SkinSense v2.

---

## 1. Deliberately Out-of-Scope Decisions

1. **iOS Native Production Target**:
   - The monorepo and UI kit are cross-platform (Web + React Native), but production camera pipelines are specifically tuned for Android (`react-native-vision-camera` + `react-native-fast-tflite`). iOS native support is deferred to v2.1.
2. **Offline Photo Synchronization Queue**:
   - Captured photos are processed immediately on-device (landmarks, redness index, spot extraction) and saved locally. Syncing photo blobs to cloud storage requires active internet connectivity.
3. **In-App Purchases & Monetization**:
   - SkinSense is completely free, open-source software (FOSS). No paywalls, ads, or analytics tracking libraries are included.
4. **Third-Party Social Authentication**:
   - Authentication is strictly Google OAuth 2.0 (`signInWithIdToken`). Facebook, Apple, and email/password authentication were intentionally omitted to avoid credential stuffing vulnerabilities.

---

## 2. Critical Dependency Notes & Patches

### A. `react-native-vision-camera-face-detector@2.1.0`
- **Location**: `patches/react-native-vision-camera-face-detector@2.1.0.patch`
- **Rationale**: React Native 0.76 introduces the new architecture with Nitro Modules. The upstream npm package contains deprecated build configurations that cause Android Gradle compile failures.
- **Handling**: Bun applies this patch automatically during `bun install` via `patchedDependencies` in root `package.json`.

### B. MediaPipe & TensorFlow Lite On-Device AI
- **Model**: `face_landmarker.tflite`
- **Execution**: Run via `react-native-fast-tflite` on Android GPU/NPU delegates.
- **Performance**: Landmark inference runs in < 25ms per frame on mid-range Android chipsets (Snapdragon 7 series / Dimensity 8000+).

### C. Turborepo Workspace Architecture
- `@skinsense/domain`: Pure TypeScript logic (redness algorithms, geometric transforms, routine streak maths, CSV export). No UI or DOM dependencies; shared across web and mobile.
- `@skinsense/tokens`: Shared design tokens compiled to Tailwind classes (`dist/web.css`) and NativeWind classes (`dist/nativewind.css`).
- `apps/web`: Next.js 16 (App Router) with Turbopack, Tailwind CSS v4, Lucide icons, Three.js 3D stage.
- `apps/mobile`: Expo 52, React Native 0.76, NativeWind v4, Expo Router v4.
