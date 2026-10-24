# 04: Hôm nay

**What to build:** opening the app shows the redesigned Hôm nay: a night photo band with the date and large title, tonight's photo card, both streaks, tonight's checklist and the last 7 days per zone, with designed empty, loading and error states and the Android entrance motion. Spec: Motion; stories 5, 6, 9, 10–17.

**Blocked by:** 03.

**Status:** done

- [x] Night photo band with date and title; the labelled gradient placeholder stands in until real photos exist
- [x] Without tonight's photo: a card with the last capture, its spot count and "Chụp ảnh tối nay"
- [x] Capture streak and routine streak side by side on solid cards (not glass)
- [x] Tonight's checklist (component from 03) with the hairline progress line
- [x] Last 7 days of redness per zone, each with an arrow and a word
- [x] Brand-new user: "no photos yet", streaks at 0, unticked routine
- [x] Loading shows Skeleton blocks the size of the real cards; load error shows "Thử lại"
- [x] Android: cards FadeInDown 460ms with 80ms stagger, zone bars 700ms ease-out cubic with 420ms + 80ms per row delay, the mark draws on first open per session; reduced motion keeps fades only (values in code and the mark/bars seen finished on the emulator; timings and the reduced-motion swap not measured)
- [x] The FadeInDown offset distance used is recorded in DESIGN.md
- [x] Content is readable before any motion code runs
- [x] Web and Android screen tests cover success, first run, loading and error with the data module mocked
- [x] Light and dark screenshots (web 1440, web 390, Android) match AndroidToday / WebToday / PhoneToday and the FirstRun, Loading, LoadError artboards; differences noted here

## Decisions (2026-09-15)

- Streak cards: solid at 390/Android (PhoneToday, AndroidToday) and glass at 1440 (WebToday), where they sit over the 480px band — DESIGN.md allows glass over the photo; the criterion wording came from the Android board.
- Zone bars: no Today board draws them, but DESIGN.md/BrandMotion require 1px tracks filled `good`/`fg`. The hairline under each row is the track (the last row gains a bottom hairline), filled to the zone's share of tonight's highest reading (negative a* clamps to 0). Static on web; Android fills 700ms ease-out cubic, delay 420 + 80/row.
- Mark: no Today board shows it; it sits 40px at the header's right edge (as `MARK:40` on AndroidSignIn), under the placeholder pill. Drawn with react-native-svg `strokeDashoffset` + Reanimated instead of Skia (`@shopify/react-native-skia` is not on `main`; adding it needs a native rebuild). Draws once per app session (module flag); later opens show it static. Reduced motion: strokes jump, the dot still fades.
- FadeInDown: header + 4 cards, delays 0/80/160/240/320ms, from 12px above, CSS ease-out (canvas `.in`); recorded in DESIGN.md. `(tabs)/index.tsx` remounts Today on every focus, so cards replay on each return to the tab (same as the previous FadeIn). Reduced motion swaps to `FadeIn` with `ReduceMotion.Never` so the fade actually plays.
- Android glass card: surface at 72% + fg 14% border via hex alpha from tokens.json, no backdrop blur (no blur view installed; ticket 02 precedent). The canvas grain (`feTurbulence`) is dropped on Android (react-native-svg has no Android implementation) and kept on web below md.
- Web `Today` loses `latestPhotoUrl` (no thumbnail in the new card); orphaned `Today.tonightPhoto/lastPhoto/photoAlt/photoBadge/vs7` keys removed, `noTonight/tonightSaved/last/photoPlaceholder/redness7/trends` added (en + vi). Existing `Today.nights` "đêm liên tiếp" kept (rule: existing strings stay) and set nowrap so it wraps whole under the number at 390.
- Load error: both `load-state.tsx` failed branches restyled to the LoadError boards (circle + cloud-off, outlined "Thử lại" with a refresh icon); the loading branch is untouched (Trends/Routine still use it). Today draws its own skeletons.
- Web hydration: "today" is set after mount, so the date line is blank on the server render and the skeleton never mismatches.
- "Sửa routine" on Android stays (the only way into the editor besides the long-press shortcut); no change needed in ticket 03's files. Embedded card padding (ticket 03: 20/24/8) vs AndroidToday (18/20/6) left as is.

## Differences from canvas

- Android 7-day rows have an extra bottom hairline on the last row (the zone bar track); web the same.
- Android Today has the mark in the header (not on the board); no grain over the band.
- Web 390 streak unit reads "đêm liên tiếp" under the number instead of " đêm" beside it.
- Emulator screenshots show the account's English routine labels under Vietnamese chrome (seeded before the locale switch); no data was written. The Android load error could not be forced on the emulator (a dead proxy only hangs the query); it is covered by tests only, and the earlier `android-dark-error.png` showed the success state and was removed (review 15/09). Android Loading has a dark shot only; FirstRun has none.
- Android FirstRun is not captured either (the emulator account has photos).
- Web first-run, loading and error states are not reachable on `/demo` (generated data always loads) and no Playwright-mounted test page exists: covered by the Vitest states only.

## For ticket 03 (report only, files not edited here)

- The embedded checklist keeps its own entrance fade (`FadeIn.duration(200)` on Android, `motion-safe:animate-in fade-in` on web) inside Today's card entrance, so it fades twice; the embedded variant could drop it.
- The shared `LoadState` error branch now carries the LoadError board's offsets (`my-auto`, bottom padding 72/120px); it also renders inside the embedded routine card and on the Routine screen when their load fails. Accepted for now.

- Review 15/09: the zone-bar share moved to `rednessShare` in `packages/domain` (tested, both apps call it); DESIGN.md Motion no longer claims Skia for the Android mark.

## Now

- Done 2026-09-15 (uncommitted). Screenshots in `~/docs/case-study/skinsense/build/04-hom-nay/`: web-today-{1440,390}-{light,dark}[-full], android-{light,dark}[-scrolled], android-dark-loading.

## Next

- Dinh: review the diff, then `/commit`.
- On the first cold start of the dev client the load failed once (LoadError shown, "Thử lại" recovered); not reproduced, cause not proven (likely the Supabase session refresh racing the first query).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 5d2e892; today.test.tsx on web and mobile.
