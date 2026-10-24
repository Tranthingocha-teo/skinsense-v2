import type { Metadata } from "next";
import { CanvasIcon, SiteHeader } from "@/components/site-header";
import { APK_URL } from "@/lib/utils";

const LIVE_URL = "https://skinsense-v2.vercel.app";
const REPO_URL = "https://github.com/Tranthingocha-teo/skinsense-v2";

const INTRO =
  "SkinSense lets people photograph their skin every night under a guide, mark spots by hand and follow per-zone redness over time, on the web and on Android.";

// English only for every locale (spec: one source of truth); copy as approved on the canvas 15/09.
// Brackets ([Your role], [—]) are filled by Dinh once the release gates produce numbers.
export const metadata: Metadata = { title: "SkinSense case study", description: INTRO };

const META = [
  ["Role", "[Your role]"],
  ["Timeline", "[Start – end]"],
  ["Platforms", "Web (Next.js) · Android (Expo)"],
  ["Stack", "Supabase · MediaPipe · ML Kit · TFLite"],
];

const STEPS = [
  ["Capture with a guide", "Guide ellipse, a ghost of the last photo and a live light check."],
  ["Mark what you see", "Tap a spot; it is assigned to a face zone from the landmarks."],
  ["Tick tonight’s routine", "Steps the user sets, with a streak of nights kept."],
  ["Follow each zone", "Redness and spot count per zone over 7 or 30 days, with before/after."],
];

const PIPELINE = [
  ["Face landmarks", "468 points, the same mesh on web and Android."],
  ["Skin mask", "Skin separated from hair, eyes and background."],
  ["Five zones", "Forehead, both cheeks, nose and chin, built from landmarks."],
  ["a* index", "Median a* of the zone minus median a* of all skin (CIELAB)."],
];

const MEASURING_NOTES = [
  ["Why relative", "Comparing each zone with the rest of the same face cancels most of the camera and room, so there is no global white-balance step. White balance is locked at capture instead."],
  ["Where it fails", "A whole face that is inflamed, mixed lighting, darker skin compressing a*, and shadows on the nose and chin. The app says so instead of hiding it."],
];

const DESIGN_NOTES = [
  ["A font that broke Vietnamese", "Cormorant Garamond placed the circumflex on ô visibly off the letter at every weight, in Chrome and on Android. The display face became Noto Serif Display 300."],
  ["One token file", "tokens.json feeds CSS variables on the web and NativeWind on Android. The build fails if any of 24 text pairs drops below WCAG AA in either theme."],
];

const ENGINEERING = [
  ["468 landmarks on both platforms", "Web and Android share the mesh size, so zones are computed once in a pure TypeScript domain package."],
  ["Google sign-in without redirects", "Both apps hand Supabase a Google ID token; a redirect flow does not return cleanly into an installed app."],
  ["Sticky, not pinned", "A GSAP pin re-parented the hero and re-emitted the headline as a late LCP. CSS sticky with a scrubbed timeline avoids it."],
  ["Motion layout from the first paint", "Switching layout classes after hydration measured CLS 0.74. A scripting and reduced-motion media query brought it to 0."],
];

const RESULTS = [
  ["100", "Accessibility, prototype, Lighthouse mobile"],
  ["0", "Layout shift, prototype"],
  ["[—]", "Performance, release, every page [to measure]"],
  ["[—]", "QA checklist on a real Android phone [to run]"],
];

const NEXT = [
  "Real night photography in place of the placeholders",
  "Jank measured on a release build on a real phone",
  "Largest paint: fonts and hydration before first paint",
];

const LINKS = [
  ["Live site", LIVE_URL],
  ["GitHub", REPO_URL],
  ["Android APK", APK_URL],
];

const lbl = "text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
const h2 = "font-display text-[34px] leading-[1.2] font-light md:text-[44px] md:leading-[1.18]";
const h3 = "font-display text-[22px] md:text-2xl";
const ph = "rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px]";
const section = "border-t border-border px-6 py-16 md:px-24 md:py-24";
const link = "flex min-h-11 items-center gap-1.5 underline underline-offset-4 hover:text-muted-foreground";

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col gap-3.5 md:gap-4">
      <span className={lbl}>{label}</span>
      <h2 className={`${h2} text-balance`}>{title}</h2>
    </div>
  );
}

function Notes({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      {items.map(([title, body]) => (
        <div key={title} className="flex flex-col gap-2.5 md:gap-3">
          <h3 className={h3}>{title}</h3>
          <p className="text-[15px] font-light leading-[1.7] text-muted-foreground md:text-base">{body}</p>
        </div>
      ))}
    </div>
  );
}

export default function CaseStudyPage() {
  return (
    <div lang="en" className="flex flex-1 flex-col">
      <section className="relative flex h-[780px] flex-col md:h-[760px]">
        <div className="absolute inset-0 bg-photo" aria-hidden />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--background) 35%, transparent), color-mix(in oklab, var(--background) 40%, transparent) 40%, var(--background))" }}
        />
        <SiteHeader>
          <nav className="flex items-center gap-7 text-sm font-light">
            <a href={LIVE_URL} className={`hidden md:flex ${link}`}>
              Live site <CanvasIcon name="external" size={14} />
            </a>
            <a href={REPO_URL} className={`px-2 md:px-0 ${link}`}>
              GitHub <CanvasIcon name="external" size={14} />
            </a>
          </nav>
        </SiteHeader>
        <div className="relative mt-auto flex flex-col gap-[18px] px-6 pb-10 md:gap-6 md:px-24 md:pb-[72px]">
          <span className={`${lbl} text-foreground`}>Case study · 2026</span>
          <h1 className="font-display text-[44px] leading-[1.1] font-light text-balance md:max-w-[1080px] md:text-[88px] md:leading-[1.08]">
            A skin diary that measures redness on the device.
          </h1>
          <p className="text-[16.5px] font-light leading-[1.6] text-pretty md:max-w-[720px] md:text-xl">{INTRO}</p>
        </div>
        <span className={`absolute right-14 bottom-10 hidden md:block ${ph}`}>Night photo · placeholder</span>
      </section>

      <section className="grid grid-cols-2 gap-x-5 gap-y-7 border-t border-border px-6 py-10 md:grid-cols-4 md:gap-8 md:px-24 md:py-12">
        {META.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-2 md:gap-2.5">
            <span className={lbl}>{label}</span>
            <span className="text-[15px] font-light leading-[1.5] md:text-base">{value}</span>
          </div>
        ))}
      </section>

      <section className={`${section} flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-8`}>
        <div className="md:col-span-5">
          <SectionTitle label="01 · Problem" title="Skin changes slowly, and memory is a bad instrument." />
        </div>
        <div className="flex flex-col gap-4 pt-2 text-base font-light leading-[1.7] md:col-span-6 md:col-start-7 md:gap-5 md:pt-[34px] md:text-[17px]">
          <p>
            Photos taken at a different distance, angle or light cannot be compared night to night. An earlier version of this project showed acne
            counts that turned out to be hardcoded sample data.
          </p>
          <p className="text-muted-foreground">
            The rebuild set two rules: every number comes from a measurement the user can inspect, and the app never diagnoses.
          </p>
        </div>
      </section>

      <section className={`${section} flex flex-col gap-7 md:gap-12`}>
        <SectionTitle label="02 · The product" title="Four steps, every night." />
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 md:grid-cols-4 md:gap-8">
          {STEPS.map(([title, body]) => (
            <figure key={title} className="flex flex-col gap-2.5 md:gap-4">
              <div className="relative h-[300px] rounded-[22px] border border-foreground/14 bg-photo md:h-[520px] md:rounded-[32px]">
                <span className={`absolute bottom-3.5 left-3.5 hidden md:inline ${ph}`}>Screenshot · placeholder</span>
              </div>
              <figcaption className="flex flex-col gap-0.5 md:gap-1">
                <span className="font-display text-lg md:text-[22px]">{title}</span>
                <span className="text-[13px] font-light leading-[1.5] text-muted-foreground md:text-sm md:leading-[1.55]">{body}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <span className={`self-start md:hidden ${ph}`}>Screenshots · placeholder</span>
      </section>

      <section className={`${section} flex flex-col gap-6 md:gap-12`}>
        <SectionTitle label="03 · Measuring redness" title="Relative to your own skin, in the same photo." />
        <ol className="flex flex-col gap-2.5 md:flex-row md:items-stretch md:gap-4">
          {PIPELINE.map(([title, body], i) => {
            const last = i === PIPELINE.length - 1;
            return (
              <li key={title} className="contents">
                {i > 0 && (
                  <span className="hidden items-center text-muted-foreground md:flex" aria-hidden>
                    <CanvasIcon name="chevron" size={22} />
                  </span>
                )}
                <div
                  className={`grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-xl border bg-card px-[18px] py-4 md:flex md:flex-1 md:flex-col md:gap-2 md:p-[22px] ${last ? "border-foreground/40" : "border-foreground/10"}`}
                >
                  <span className={`font-display text-xl font-light md:text-[22px] ${last ? "" : "text-muted-foreground"}`}>{i + 1}</span>
                  <span className="text-[15px] font-medium md:text-base">{title}</span>
                  <span className="md:hidden" />
                  <span className="text-[13.5px] font-light leading-[1.5] text-muted-foreground md:text-sm md:leading-[1.55]">{body}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <Notes items={MEASURING_NOTES} />
      </section>

      <section className={`${section} flex flex-col gap-6 md:gap-12`}>
        <SectionTitle label="04 · Design" title="Three directions, one night photo." />
        <div className="grid grid-cols-3 gap-2.5 md:gap-8">
          {/* C1 and C2 depict the rejected palettes, so their colours are content, not theme tokens. */}
          <figure className="flex flex-col gap-2 md:gap-3">
            <div className="relative h-[180px] rounded-[12px] bg-[#1D1711] md:h-[300px] md:rounded-xl">
              <span className={`absolute bottom-3.5 left-3.5 hidden md:inline ${ph}`} style={{ color: "#F2EFE8", borderColor: "#F2EFE880" }}>Canvas still · placeholder</span>
            </div>
            <figcaption className="text-[12.5px] text-muted-foreground md:text-sm">C1 · Warm dark</figcaption>
          </figure>
          <figure className="flex flex-col gap-2 md:gap-3">
            <div className="relative h-[180px] rounded-[12px] bg-[#EEF2F5] md:h-[300px] md:rounded-xl">
              <span className={`absolute bottom-3.5 left-3.5 hidden md:inline ${ph}`} style={{ color: "#191B19", borderColor: "#191B1980" }}>Canvas still · placeholder</span>
            </div>
            <figcaption className="text-[12.5px] text-muted-foreground md:text-sm">C2 · Cool light</figcaption>
          </figure>
          <figure className="flex flex-col gap-2 md:gap-3">
            <div className="relative h-[180px] rounded-[12px] bg-photo outline outline-1 outline-offset-4 outline-foreground md:h-[300px] md:rounded-xl md:outline-offset-[6px]">
              <span className={`absolute bottom-3.5 left-3.5 hidden md:inline ${ph}`}>Canvas still · placeholder</span>
            </div>
            <figcaption className="flex items-center gap-2 text-[12.5px] font-medium md:text-sm">
              <span className="hidden text-success md:inline">
                <CanvasIcon name="check" size={16} />
              </span>
              C3 · Night photo, picked
            </figcaption>
          </figure>
        </div>
        <span className={`self-start md:hidden ${ph}`}>Canvas stills · placeholder</span>
        <Notes items={DESIGN_NOTES} />
      </section>

      <section className={`${section} flex flex-col gap-5 md:gap-12`}>
        <SectionTitle label="05 · Engineering" title="Decisions that held up under measurement." />
        <div className="grid gap-5 md:grid-cols-2 md:gap-x-12 md:gap-y-8">
          {ENGINEERING.map(([title, body]) => (
            <div key={title} className="flex flex-col gap-1.5 border-t border-border pt-4 md:gap-2 md:pt-5">
              <span className="text-base font-medium md:text-[17px]">{title}</span>
              <span className="text-[14.5px] font-light leading-[1.6] text-muted-foreground md:text-[15px] md:leading-[1.65]">{body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${section} flex flex-col gap-6 md:gap-12`}>
        <SectionTitle label="06 · Results" title="Measured, not claimed." />
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-8">
          {RESULTS.map(([value, caption]) => (
            <div key={caption} className="flex flex-col gap-1 border-t border-border pt-3.5 md:gap-1.5 md:pt-[18px]">
              <span className="font-display text-5xl leading-[1.1] font-light md:text-[64px]">{value}</span>
              <span className="text-[13px] font-light text-muted-foreground md:text-sm">{caption}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${section} flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-8`}>
        <div className="flex flex-col gap-4 md:col-span-5">
          <span className={lbl}>07 · Next</span>
          <h2 className={`sr-only md:not-sr-only ${h2}`}>Still open.</h2>
        </div>
        <ul className="flex flex-col border-b border-border text-[15px] font-light leading-[1.5] md:col-span-6 md:col-start-7 md:text-base">
          {NEXT.map((item) => (
            <li key={item} className="border-t border-border py-3.5">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-col border-t border-border px-6 pt-5 pb-5 text-[13px] font-light md:h-[88px] md:flex-row md:items-center md:justify-between md:px-14 md:py-0">
        <span className="pb-1 text-muted-foreground md:pb-0">SkinSense case study</span>
        <span className="flex flex-col md:flex-row md:gap-6">
          {LINKS.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </span>
      </footer>
    </div>
  );
}
