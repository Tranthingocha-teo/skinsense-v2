# 14: Photo history, Photo detail and delete Photo

**What to build:** a user opens "Lịch sử ảnh" from Cài đặt, browses every Photo in a month-grouped grid, opens a Photo detail with the photo, spot count and a zone reading, jumps to spot marking, and deletes a bad capture after a confirmation. Notes and Tags come in 15, sharing in 17. Spec: Schema (photo deletion), Features (photo history); stories 68, 70, 73, 74.

**Blocked by:** 09.

**Status:** done

- [x] Cài đặt gains the "Lịch sử ảnh" row on both apps
- [x] Grid of the signed-in user's Photos grouped by local month, each tile with date and spot count; empty, loading and error states
- [x] Photo detail shows the photo, spot count and a zone reading, with an action to open spot marking
- [ ] Delete opens an AlertDialog listing what goes with the Photo; confirming removes the storage object and the Photo row, and Spots and ZoneReadings go through cascades (a migration adds any missing cascade; applied to production only after Dinh approves)
- [x] Screen tests on both apps: grid grouping, empty, detail, delete confirm and delete error with the data module mocked
- [ ] Playwright: history → detail → delete; Maestro: history and detail
- [ ] Light and dark screenshots (web 1440, web 390, Android) match AndroidHistory / WebHistory / PhoneHistory, the Photo artboards and PhotoDelete; differences noted here

- Review 15/09: the reddest-reading pick moved to `reddestReading` in `packages/domain` (tested, both detail screens call it). The demo history/delete additions in `lib/demo.ts` are covered only through screen tests.

## Now

- 2026-09-15: started on worktree `worktree-agent-a443ec514a9435f12` (origin/main 9f94318). Reading done. Schema check: `spots.photo_id` and `zone_readings.photo_id` already reference `photos.id` with `ON DELETE cascade` (schema.ts + 0000_init.sql), so no migration. Next: domain `groupPhotosByMonth` test-first.
- Domain `groupByMonth` (packages/domain/src/history.ts) red → green, 4 tests. Web done: `lib/history.ts` (loadHistory, loadPhotoDetail, deletePhoto storage-first), `components/photo-history.tsx` + `photo-detail.tsx`, routes `/app/history`, `/app/photos/[photoId]`, `/demo/history`, `/demo/photos/[photoId]` (demo data in `lib/demo.ts`, deletes kept in localStorage), Cài đặt "Dữ liệu › Lịch sử ảnh" row. Web tests 16 green (history 4, detail 5, settings 6, demo 1). Now: Android.
- Android written: `lib/history.ts` (also drops spot marking's cached JPEG), `components/photo-history.tsx` + `photo-detail.tsx`, routes `(app)/history.tsx`, `(app)/photos/[photoId].tsx`, Cài đặt "Data › Photo history" row, locale keys. jest: history 5 + settings 6 green; detail 4/6 (test helper returned the resolved render result instead of the router; fixed, rerunning). Written, not run: `apps/web/e2e/photo-history.spec.ts`, `apps/mobile/flows/history.yaml`. Now: web screenshots via /demo on port 3014.

- Detail test 6/6 after the fix, mobile tsc clean. Web screenshots (16 PNGs) in `~/docs/case-study/skinsense/build/14-lich-su-anh/`: settings, history, photo, photo-delete × 1440/390 × light/dark, from `/dev/settings` and `/demo`. Now: root typecheck, test, web build, then commit.
- Root `bun run typecheck` clean (5 tasks), `bun run test` green (domain 76, web 55, mobile 49), `cd apps/web && bun run build` passes with the four new routes. Committed on `worktree-agent-a443ec514a9435f12`. Delete box stays open until the Playwright spec runs against production (dialog and error states verified by screen tests only); Playwright/Maestro and Android screenshots are in Next.

## Next

- Android screenshots (emulator + Metro belonged to another agent during this ticket): with Metro running and the dev client signed in on an account with photos, open Cài đặt › Photo history, `adb shell cmd uimode night no|yes`, `adb exec-out screencap -p > ~/docs/case-study/skinsense/build/14-lich-su-anh/android-history-{light,dark}.png`; tap a tile for `android-photo-{light,dark}.png`; tap Xóa ảnh for `android-photo-delete-{light,dark}.png`, then Hủy. Do NOT tap the dialog's Xóa ảnh (it deletes the photo in production).
- Playwright history → detail → delete (writes to production with the service-role key: seeds a photo, readings, spots and a storage object for `e2e-history@skinsense.test`, then deletes them through the UI; run only after Dinh approves): `cd apps/web && bunx playwright test e2e/photo-history.spec.ts`
- Maestro history and detail (read-only, but runs against the signed-in production account; needs Metro + the emulator, at least one saved photo, device locale en): `maestro test apps/mobile/flows/history.yaml`
- No migration to apply: see Decisions.

## Decisions

- No migration: `spots.photo_id` and `zone_readings.photo_id` already reference `photos.id` with `ON DELETE cascade` (schema.ts, `drizzle/0000_init.sql`). `photo_tags` gets its cascade in ticket 15.
- Delete order is storage object first, then the Photo row: a failure after the object is gone leaves the row, so the Photo stays listed and Delete can be retried; row-first could leave a private image nobody can see or remove. The owner-folder storage policy (0002) already allows the delete. Android also deletes spot marking's cached `${id}.jpg`.
- The zone reading on Photo detail is the reddest zone of that night (canvas shows "Trán · mẩn đỏ" without saying which zone).
- Phone width (web 390 and Android): the canvas has no reading card, so the zone reading card sits where the Note card is drawn; the spot count stays the badge over the photo (canvas). Web 1440 keeps both stat cards; at 390 the spot card is screen-reader-only.
- The delete dialog lists "ảnh, nốt mụn và chỉ số" without "ghi chú": Notes and Tags do not exist until ticket 15, which adds them to the list. Error line (not drawn): "Xóa không thành công. Ảnh vẫn còn, thử lại sau."
- Not rendered now: filter chips, Note, Tags (ticket 15), Chia sẻ / share icon (ticket 17). Detail keeps readings → (Note, Tags) → actions order so 15 inserts its blocks between them.
- Empty history (not drawn): Today's copy "Chưa có ảnh nào. Chụp ảnh đầu tiên để bắt đầu nhật ký." with the filled "Chụp ảnh tối nay" link. Loading: Skeleton tiles on web; the shared LoadState spinner on Android (no RNR Skeleton installed yet).
- Grouping by local month is the domain function `groupByMonth` (shared by both apps). Month label adds the year only for past years.
- Thumbnails are the full-size photos through signed URLs (lazy-loaded on web, cached by expo-image): Supabase image transforms need a paid plan.
- Xem thử gets the history cheaply from the demo generator: `/demo/history` and `/demo/photos/[photoId]`, tiles as the labelled placeholder, deletes kept in this browser (`deleted` in the demo store) and hidden from Hôm nay and Xu hướng too. The demo has no Cài đặt, so its history back link goes to `/#cta` like every other screen the demo lacks.
- Back links are Links (history → Cài đặt, detail → history), as Routine does, not `router.back()`.
- Screenshot differences from the canvas: the Xem thử banner on /demo shots and Next's dev indicator bubble; the "Ảnh · placeholder" pill shows because demo photos are placeholders (signed-in history shows real photos, no pill); no chips/Note/Tag/share (tickets 15/17).

## Audit 2026-10-17

- Status: done
- Evidence: Commits 439e692 and 1d99516; photo-history.test.tsx and photo-detail.test.tsx on both apps; e2e/photo-history.spec.ts; flows/history.yaml.
