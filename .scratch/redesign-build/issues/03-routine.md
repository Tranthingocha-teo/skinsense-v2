# 03: Routine

**What to build:** the Routine screen and the tonight's checklist component are rebuilt from canvas 2: users rename, move, delete and add RoutineItems in place, get an inline error on a duplicate label, and on Android a tick presses in, springs back, vibrates and moves the progress line. The checklist component is reused by Hôm nay (04). Spec: Motion; stories 39–43.

**Blocked by:** 02.

**Status:** done

- [x] Each row has a DropdownMenu (web) / menu (Android) with rename, move and delete
- [x] Rename turns the row into an inline field; add is a field at the end of the list
- [x] A duplicate label shows an inline error and is not saved (labels are the snapshot key, ADR 0004)
- [x] A hairline progress line shows tonight's completion
- [x] Android tick: scale 0.78 in 90ms, then spring (damping 11, stiffness 320), medium/light haptics, progress line in 360ms; reduced motion keeps fades only (values in code; not observed on the emulator because ticking writes data)
- [x] A failed write keeps today's behaviour (reload), no new error screen
- [x] Web and Android screen tests cover ticking, rename, add, delete, move and the duplicate error with the data module mocked
- [ ] Existing routine-checklist tests and the Maestro routine-checklist flow pass
- [x] Light and dark screenshots (web 1440, web 390, Android) match AndroidRoutine / WebRoutine / PhoneRoutine and the RoutineEdit states; differences noted here

## Decisions (2026-09-15)

- Duplicate wording comes from canvas WebInteraction ("Bước này đã có", `danger` border + 12px text); en: "This step already exists". Empty or unchanged input cancels silently; a duplicate keeps the field open with the error and persists nothing (submit and blur alike).
- Move keeps `swapPositions` on the existing `routine_items.position` column; no migration.
- Web row menu is shadcn `DropdownMenu` with `modal={false}` and `onCloseAutoFocus` prevented: a modal Radix menu traps focus, so the rename field that "Đổi tên" opens was blurred (and closed) before the menu finished closing.
- Whole row is the tick target (DESIGN.md): web `<label>` wrapping a visually hidden checkbox; Android `Pressable role="checkbox"` wrapping circle + label, so the Maestro flow's `tapOn: "Cleanser"` still ticks.
- Android tick motion lives in a `Tick` component (Reanimated `withSequence(withTiming 0.78/90ms, withSpring damping 11 stiffness 320)`, `impactAsync` Medium on tick / Light on untick), the hairline in `ProgressLine` (`withTiming` 360ms); both use `ReduceMotion.System`, the screen `FadeIn` stays (fades kept). The rn-primitives `Progress` (spring) is no longer used here.
- Android has no Escape and the back key hides the keyboard without blurring, so `keyboardDidHide` commits the open field like blur does (empty → close, duplicate → error stays).
- Android night tint is `react-native-svg` gradients in `app/(app)/routine.tsx` (outside the SafeAreaView so it runs under the status bar), colours from `tokens.json` keyed by `useColorScheme()` (ticket 02's precedent; NativeWind tokens are HSL vars, SVG needs hex).
- Android opacity modifiers (`fg/10`, `fg/14`, `fg/30`) are not trusted with the `hsl(var(--x))` colour config, so card, menu and dashed borders use the `line` token (`border-border`) and the open trigger uses `bg-surface-2`. Web keeps the canvas mixes (`border-foreground/10|15|30`).
- Embedded (Hôm nay) variant follows the WebToday card (26px display title, "Sửa routine" 13px link, hairline, 48px rows, no menu) on both apps and keeps its own inner padding until ticket 04 rebuilds the card around it.

## Differences from canvas

- Android Today canvas has no "Sửa routine" link; both apps keep the link (existing behaviour, the only way into the screen) — ticket 04 decides.
- Android menu dots are lucide `EllipsisVertical` at stroke 2.8 instead of the canvas r=1.4 filled circles.
- The web `/demo` header (Xem thử banner) is still the old layout (ticket 08).
- Emulator screenshots show the account's English item labels under Vietnamese chrome (seeded before the locale switch); no data was written.

- Review 15/09: the duplicate-label check moved to `isDuplicateRoutineLabel` in `packages/domain` (both apps call it); the Android back-key handler now only blurs the focused field so `onBlur` commits once. Screenshots cover the edit states in web 1440 dark, web 390 and Android light (menu, rename, add, duplicate); web 1440 light and Android dark show the list and menu only. Reduced motion is set in code (`ReduceMotion.System`) but was not observed on the emulator.
## Now

- Done 2026-09-15 (uncommitted). Screenshots in `~/docs/case-study/skinsense/build/03-routine/`: web-routine-{1440,390}-{light,dark}[-menu|-rename|-add|-duplicate], android-{light,dark}, android-light-{menu,rename,add,duplicate}, android-dark-menu.

## Next

- Dinh: review the diff, then `/commit`.
- Maestro flow (needs the signed-in emulator and writes tonight's entry; not run): `cd apps/mobile && bunx expo start --dev-client` in one terminal, then `maestro test apps/mobile/flows/routine-checklist.yaml` (the flow taps "Tonight's routine"/"Cleanser", so the emulator must be in English).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 09c8a4b; routine-checklist.test.tsx on web and mobile; apps/mobile/flows/routine-checklist.yaml.
