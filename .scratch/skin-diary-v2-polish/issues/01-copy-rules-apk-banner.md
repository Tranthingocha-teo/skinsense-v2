# 01: Copy rules + phone-browser "dùng APK" banner

**What to build:** every Vietnamese string on web and Android calls the metric "Chỉ số mẩn đỏ" and the Google button reads "Đăng nhập bằng Google"; a visitor opening capture in a phone browser sees a banner pointing them to the Android APK instead of a broken camera flow. Spec rows 1–2, stories 10, 11, 25. Estimate 0.5 h.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] "Độ đỏ" and "Chỉ số đỏ" appear in no web message file and no mobile locale file (disclaimers included); the metric reads "Chỉ số mẩn đỏ"
- [x] The Google sign-in button reads "Đăng nhập bằng Google" (vi) on web and Android; header/nav links keep the short "Đăng nhập"
- [x] English strings stay consistent with the renamed concept
- [x] Web capture on a phone-width/touch browser shows a banner with the APK download link (stable `releases/latest/download/skinsense.apk` URL); desktop capture is unchanged
- [ ] Deployed to Vercel production

## Now

- Copy renamed in both apps' vi/en files ("Chỉ số mẩn đỏ" / "Redness index"). Google button already reads "Đăng nhập bằng Google": mobile from its locale, web from GIS `renderButton` with the vi locale (default `signin_with` text). Capture banner shows on `pointer: coarse` (CSS only) with the APK link; `APK_URL` moved to `lib/utils.ts`. Typecheck + web/mobile capture and trends tests green.

## Next

- Committed 2cc6c96. Production deploy blocked by auto mode (needs Dinh's approval): `vercel deploy --prod` from the repo root, then tick the last box. Ticket 02 continues meanwhile.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 2cc6c96; "Chỉ số mẩn đỏ" copy rule and phone-browser APK banner (capture.test.tsx). The Vercel-deploy box was an owner step, now moot.
