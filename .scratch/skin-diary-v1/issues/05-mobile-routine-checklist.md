# 05: Mobile — routine checklist

**What to build:** the same routine-checklist behaviour as ticket 04, native.

**Blocked by:** 03

**Status:** done

- [x] Same functional criteria as ticket 04: seeded defaults, add/rename/delete/reorder, snapshot-on-tick (not id reference), works without a photo, historical entries unaffected by later edits
- [x] Built with React Native Reusables + NativeWind v4
- [x] Component tests via `jest-expo` + `@testing-library/react-native` (4 green); Maestro flow written, **not executed** (see Now)
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). NativeWind v4.2 + Tailwind 3.4 installed manually in `apps/mobile` (RNR's `init` only scaffolds new projects): `babel.config.js` (`jsxImportSource: nativewind`), `metro.config.js` (`withNativeWind`), `tailwind.config.js` (nativewind preset + shadcn color names), `src/global.css` (Clinical calm tokens as HSL triplets — Tailwind 3 can't parse the oklch web uses; same values, plus the stock shadcn names RNR's components reference), `components.json`, `src/lib/utils.ts`. RNR CLI `add checkbox dropdown-menu text input button progress` → `src/components/ui/*` (+ `icon`, `native-only-animated-view`; `lucide-react-native` + `react-native-svg` via `expo install`). `PortalHost` in `_layout.tsx`. Tailwind hoisting checked: root `node_modules/tailwindcss` is 3.4.19 (nativewind resolves it), web keeps 4.3.3 nested — web tests/typecheck still green.

`src/lib/routine.ts` = web's data layer with the `supabase` singleton (same function names → same mock shape). `src/components/routine-checklist.tsx` mirrors web's state logic 1:1 (snapshot-on-tick, optimistic writes, reload on failed write, dedupe/empty label guard); menu = RNR `DropdownMenu` (Rename / Move up / Move down / Delete), inline rename + add via `Input`. Route `(app)/routine.tsx` + `Link` from `(app)/index.tsx`; `routine` namespace in `src/locales/{vi,en}.json` (i18next `{{}}` interpolation, `defaults` via `returnObjects`). `@skinsense/domain` added for `routineCompletionPercent`.

Jest infra this ticket had to add (`jest.config.js`): preset `jest-expo/android` (app is Android-only; also keeps dropdown-menu off iOS's `FullWindowOverlay`, which jest lacks), `transformIgnorePatterns` for `@rn-primitives`/`nativewind`/`lucide-react-native`, a `moduleNameMapper` to lucide's CJS build (its `react-native` export condition is untransformed ESM), `jest.setup.js` (mock `react-native-worklets` — Reanimated 4's real entry needs the native module), `jest.setup-after-env.js` (`setUpTests()` + a `View.prototype.measure` accessor so `@rn-primitives` menus, which portal only after measuring their trigger, can open in tests). RNTL 14's `render`/`fireEvent` are async — every call is awaited. 4 component tests mirror web's; `bun run test` 6 mobile / 6 web / 32 domain green, `bun run typecheck` 4/4.

Bundle verified without a device: `expo export --platform android` (Metro + NativeWind CSS + React Compiler experiment) → 6.9MB hbc, exit 0. **Not verified on a device**: no `android/` exists (first `expo run:android` is ticket 18) and mobile has no Google sign-in yet (01b), so `flows/routine-checklist.yaml` (tick → persist → restart → still ticked) is written but has never run.

`/code-review` (Standards + Spec, Sonnet sub-agents) found and fixed: inline `Input` wired both `onSubmitEditing` and `onBlur` (RN's default `blurAndSubmit` fires both → a duplicate `addItem`), now `onBlur` only; `className` on `SafeAreaView` (no NativeWind interop) → plain `View` carries the token; unused `routine.cancel` string dropped (the dropdown auto-dismisses); lucide jest mapping via `require.resolve` instead of a hoisting-dependent path. Not changed: `validLabel`/tick-snapshot/`localDate` logic is duplicated between web and mobile components (pre-existing shape from ticket 04; moving it into `packages/domain` is a follow-up), and "historical entries unaffected" is guaranteed by the schema (labels, no FK) rather than by a test on either platform.

Added `src/app/(app)/_layout.tsx` (a `Stack`, `headerShown: false`): with two screens in the group, the group needs its own navigator so the root's `Stack.Screen name="(app)"` + `Stack.Protected` cover both; a layout-less group is flattened into the parent. First thing ticket 18's boot should confirm: signed-out → `sign-in`, signed-in → `(app)/index` → `/routine`.

## Next

- Run `maestro test apps/mobile/flows/routine-checklist.yaml` once 18 (dev build) and 01b (mobile sign-in) land; that is the remaining unchecked box in spirit.
- `/code-review` ran; commit proposed — Dinh types `/commit`.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 7e5447f, then redesigned by redesign-build 03 (09c8a4b); mobile routine-checklist.test.tsx; apps/mobile/flows/routine-checklist.yaml.
