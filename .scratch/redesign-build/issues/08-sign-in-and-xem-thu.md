# 08: Android sign-in and Xem thử on both apps

**What to build:** an Android visitor lands on a sign-in screen over a night photo with Google sign-in, "Xem thử" and the privacy link, and can try the app on sample data; on both apps every Xem thử screen carries the "Dữ liệu mẫu" banner with persona, reset and Google sign-in. Android had no demo mode before this ticket (decided in `/to-tickets` 15/09). Stories 44, 45, 52, 53.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Android sign-in: night photo, Google sign-in, "Xem thử", privacy link; a failed Google sign-in shows the error on the screen
- [ ] Android Xem thử covers the same screens as web Xem thử (Hôm nay, Routine, Đánh dấu nốt mụn, Xu hướng), fed by the domain demo generator, with nothing sent to Supabase
- [ ] Android Xem thử changes stay on the phone; reset restores the generated data
- [ ] The banner (persona, reset, Google sign-in) appears on every Xem thử screen on web 1440, web 390 and Android, above the photo layer
- [ ] Web Xem thử route and data stay as today
- [ ] Screen tests: Android sign-in (success path, error, Xem thử entry), banner reset on both apps
- [ ] Playwright: Xem thử banner reset
- [ ] Light and dark screenshots match AndroidSignIn, SignInError and the DemoToday artboards (Android, Web, Phone); differences noted here

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: Web half exists: demo routes under apps/web/src/app/demo, demo-banner.tsx, google-sign-in.test.tsx. Android sign-in (apps/mobile/src/app/sign-in.tsx) has Google sign-in only.
- Left: Android Xem thử (no demo mode anywhere under apps/mobile/src), its entry on the sign-in screen, the Android banner, the sign-in and banner screen tests, the Playwright banner-reset spec. Covered by handoff-completion 04.
