# Testing, dev loop and distribution (research 2026-09-11)

## Test stack (per package)

| Package | Unit / component | E2E |
|---|---|---|
| `packages/domain` | Vitest | — |
| `apps/web` (Next.js) | Vitest (+ Testing Library where a component is interactive: tap-mark canvas, capture guide) | Playwright, mobile emulation, fake camera via `--use-fake-device-for-media-stream` + `--use-file-for-fake-video-capture` |
| `apps/mobile` (Expo) | `jest-expo` + `@testing-library/react-native` + `expo-router/testing-library` (router mocks) | Maestro on the Android emulator |

- jest-expo + RNTL work with the New Architecture; RNTL replaced `react-test-renderer` (not supported on React 19+).
- Running Vitest for the domain package and jest-expo for mobile side by side is a common monorepo pattern; each package owns its config.
- Detox on Linux supports Android but Expo integration is community-maintained; skipped.

## Maestro on Linux

- Install: official script `curl -fsSL https://get.maestro.mobile.dev | bash` (Java 17 present at `/usr/lib/jvm/java-17-openjdk`).
- Drives a dev-client build by package id; `launchApp` grants all permissions by default, or set explicitly with `setPermissions` in the flow YAML.
- Fake camera image: Android emulator "Virtual Scene" camera; replace the SDK's `poster.png`/scene assets or start the emulator with `-camera-back virtualscene` before the flow runs (not a Maestro command).

## Dev loop on this laptop (no Mac, no phone attached)

- `/dev/kvm` accessible, VT-x on, webcam at `/dev/video0`, ~328 GB free. SDK at `/opt/android-sdk` (owned by user), platform 36, build-tools 35–37, cmdline-tools 23; the `emulator` package, a system image and an AVD were missing at grill time and are installed by the bootstrap.
- Start with the laptop webcam as the phone camera: `emulator -avd <name> -camera-front webcam0` (`emulator -webcam-list` to check the id).
- `expo run:android` builds locally (first run downloads NDK/Gradle, several GB). Real phone only for a pre-demo check: GPU delegate and AWB lock differ from the emulator.

## EAS (free plan, accessed 2026-09-11)

- 30 builds/month total, max 15 iOS; low-priority queue.
- Android internal distribution: `eas build -p android --profile preview` → APK link; reviewers install without an Expo account (enable unknown sources). Link expiry not documented (unverified).
- EAS Update: push JS-only fixes without a rebuild; free tier 1,000 MAU.
- iOS: any dev build with native modules on a personal iPhone requires the paid Apple Developer Program ($99/yr); a free Apple ID only works with Xcode on a Mac (7-day builds). Codemagic replaces the Mac, not the account. Therefore no native iOS in this project.

## Vercel Hobby

- Limits: 1M edge requests, 1M function invocations, 4 CPU-hours, 300 s max function duration, custom domains allowed.
- Fair-use wording: Hobby is for "non-commercial, personal use". A non-paid graduation project fits; Vercel decides interpretation.

## Sources

- https://docs.expo.dev/develop/unit-testing/
- https://docs.expo.dev/router/reference/testing/
- https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
- https://docs.maestro.dev/advanced/configuring-permissions
- https://developer.android.com/studio/run/emulator-use-camera
- https://wix.github.io/Detox/docs/introduction/project-setup/
- https://docs.expo.dev/build/internal-distribution/
- https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/
- https://expo.dev/pricing and https://docs.expo.dev/billing/plans/
- https://vercel.com/docs/plans/hobby
