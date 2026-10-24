# 10: Landing sections

**What to build:** a first-time visitor on `/` sees the redesigned landing at desktop and 390: the hero with one line, Google sign-in and "Xem thử", the "Cách hoạt động" section, the on-device AI section, the web vs Android table with the APK QR code, the FAQ and the trust section. The scroll stage and the particle face come in 11. Stories 56, 58 (layout), 59, 60.

**Blocked by:** 01.

**Status:** done

- [x] Hero: one-line statement over the night photo placeholder, Google sign-in, "Xem thử"
- [x] The logo mark draws once per load (1.4s, second circle +0.25s, dot fade 0.4s at 1.2s); reduced motion shows it drawn
- [x] "Cách hoạt động" shows the four steps beside a static slot where 11 mounts the particle face
- [x] On-device AI section, web vs Android table with a QR code for the APK, FAQ (Accordion), trust section
- [x] Layout matches the 390 artboard at phone width
- [x] The page is readable with scripts not yet loaded
- [x] Web tests: sign-in and "Xem thử" actions render, FAQ items expand
- [x] Light and dark screenshots (1440 and 390) match WebLanding / PhoneLanding; differences noted here

## Decisions
- Landing is a sync `Landing` component (`useTranslations`/`useLocale` in a Server Component) so the RTL test renders it; `page.tsx` only mounts it. The scroll stage is left out with a comment between hero and "Cách hoạt động"; `components/hero/*` and its test stay for ticket 11.
- QR: the existing `public/apk-qr.svg` (qrencode, decoded with zbarimg = APK_URL) is reused as an `<img>`; no dependency, no runtime request. Its black/white is a scan requirement, not theme colour; hidden below md as on PhoneLanding.
- One `GoogleSignIn` instance (hero, `#cta`): the trust-section "Đăng nhập bằng Google" and the header "Đăng nhập" are anchors to `#cta` (a second instance would call `google.accounts.id.initialize` twice with different nonces). Review 15/09: DESIGN.md wins over the artboard on "one filled accent button per screen", so the header "Đăng nhập" is outlined and only the trust-section button stays filled (the hero button is Google's own rendering). The comparison table keeps non-"Có" values in full text colour, as the artboard draws them.
- FAQ arrays reordered in vi.json and en.json to the artboard order ("Chỉ số mẩn đỏ…" first, opened by default); strings unchanged. Accordion (shadcn) restyled: plus/close icons at stroke 1.5 instead of chevrons (FAQ is its only user).
- New strings: `signInGoogle`, `compareWebShort`, `compareAndroidShort`, `apkTitle` (vi + en). `sceneCapture/Mark/Trend` stay for ticket 11.
- `LocaleSwitch` is hidden below md as on PhoneLanding (it wrapped the 390 header); the phone locale comes from Accept-Language.
- Mark draw is CSS only (`.mark-draw`, `.mark-draw-dot` in globals.css): 1.4s cubic-bezier(0.65,0,0.35,1), second ring +0.25s, dot fade 0.4s at 1.2s; `prefers-reduced-motion: reduce` removes the animation (drawn). Verified via computed styles in Chrome.

## Screenshots
`~/docs/case-study/skinsense/build/10-landing-sections/web-landing-{1440,390}-{light,dark}.png` (full page), plus `web-landing-1440-nojs.png` (JavaScript disabled: h1, sections and the first FAQ answer render).
Differences from WebLanding / PhoneLanding: no scroll-stage section (ticket 11), so the page is 4368 / 5105 tall instead of 5328 / 5884; the Google button is Google's rendered one (white, 40px, not full width at 390) instead of the filled canvas button; the Next dev indicator appears bottom-left in dev shots.

## Now
- Done; committed on the worktree branch.

## Next
- Ticket 11: scroll stage between hero and "Cách hoạt động", particle face into the static slot (`#how` first child).

## Audit 2026-10-17

- Status: done
- Evidence: Commits 672d8b0 and a053f2b; apps/web/src/components/landing.test.tsx.
