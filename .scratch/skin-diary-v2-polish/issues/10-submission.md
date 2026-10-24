# 10: Fixed submission step

**What to build:** the deliverables for 23:59 2026-09-14 exist from whatever is merged — a Vercel production link, a release APK at the stable GitHub Release URL, and a public source repo. ~1 h.

**Blocked by:** None — time-triggered: starts by **22:30** whatever ticket is in progress (finish that bounded step, write its handoff, then switch here)

**Status:** superseded (by portfolio-release-gates 03, 06)

- [ ] Privacy page contact `hi@gmail.com` replaced by a GitHub Issues link (web and the mobile privacy link target)
- [ ] Release APK built with `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` — no `gradle.properties` edit (background build with `notify-send`, ETA stated)
- [ ] The EAS-signed release on `dinh144/skinsense-releases` replaced by this APK as `skinsense.apk`; `releases/latest/download/skinsense.apk` downloads it
- [ ] **Dinh:** uninstall the preview APK on the phone first (different signer), install the release APK, Google sign-in works
- [ ] **Dinh confirms** before the source repo is flipped public (outward-facing)
- [ ] Vercel production deploy is the latest `main` commit and loads landing, demo and sign-in

## Now

## Next

- Before `assembleRelease`: `apps/mobile/android` is gitignored and was generated before ticket 02's icon/splash change, so run `bunx expo prebuild --platform android` first (keeps the keystore? check `android/app/*.keystore` + signing config survive; back them up before prebuild).

## Audit 2026-10-17

- Status: superseded (by portfolio-release-gates 03, 06)
- Evidence: Submitted 2026-09-20 (AGENTS.md). The owner-specific steps (release APK, owner's releases repo, public flip) are replaced by the signed release pipeline in portfolio-release-gates 03 and 06; the privacy-contact change (src still contains no hi@gmail.com, grep found none) is handled by handoff-completion 16.
