import { ZONES } from "@skinsense/domain";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ParticleFaceSlot } from "@/components/face/particle-face-loader";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LocaleSwitch } from "@/components/locale-switch";
import { CanvasIcon, SiteHeader } from "@/components/site-header";
import { ScrollStage } from "@/components/stage/scroll-stage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { APK_URL } from "@/lib/utils";

type Item = { title: string; body: string };

// Canvas classes (design-2/build.mjs) as token utilities.
const lbl = "text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
const h2 = "font-display text-4xl leading-[1.18] font-light md:text-[48px] md:leading-[1.15]";
const ph = "rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px]";
const btn = "flex h-[52px] items-center justify-center gap-2.5 rounded-lg bg-primary px-6 text-[15px] font-medium text-primary-foreground";
const btnO = "flex h-[52px] items-center justify-center gap-2.5 rounded-lg border border-foreground/55 px-6 text-[15px]";
const card = "rounded-xl border border-foreground/10 bg-card";
const section = "border-t border-border px-6 py-16 md:px-24 md:py-0";
const yesCell = "font-medium text-success";

// Layout: canvas WebLanding at md and up, PhoneLanding below (spec stories 56, 58–60).
// Sync component (useTranslations / useLocale work in Server Components) so the
// landing test renders it inside NextIntlClientProvider. proxy.ts already sends a
// signed-in visitor to /app.
export function Landing() {
  const t = useTranslations("Landing");
  const tc = useTranslations("Capture");
  const locale = useLocale();
  const steps = t.raw("steps") as Item[];
  const aiSteps = t.raw("aiSteps") as Item[];
  const compareRows = t.raw("compareRows") as { label: string; web: string; android: string }[];
  const faq = t.raw("faq") as { q: string; a: string }[];
  const yes = t("compareYes");
  const cell = (v: string) => <td className={v === yes ? yesCell : v === "—" ? "text-muted-foreground" : ""}>{v}</td>;
  const navLinks = [
    ["#how", t("navHow")],
    ["#ai", t("navAi")],
    ["#faq", t("navFaq")],
    ["#trust", t("navPrivacy")],
  ];

  return (
    <>
      <section className="relative flex h-[844px] flex-col md:h-[900px]">
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(38% 46% at 60% 22%, color-mix(in oklab, var(--photo-c) 55%, transparent), transparent 70%), radial-gradient(70% 65% at 25% 85%, var(--photo-a), transparent 75%), linear-gradient(180deg, var(--photo-b), var(--background))",
          }}
        />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--background) 40%, transparent), color-mix(in oklab, var(--background) 12%, transparent) 45%, var(--background))",
          }}
        />
        <SiteHeader
          drawMark
          nav={
            <nav className="hidden items-center justify-center gap-7 text-sm font-light md:flex">
              {navLinks.map(([href, label]) => (
                <a key={href} href={href} className="flex min-h-11 items-center hover:text-muted-foreground">
                  {label}
                </a>
              ))}
            </nav>
          }
        >
          <div className="flex items-center gap-3 md:justify-end md:gap-5">
            {/* PhoneLanding has no switch: the phone locale comes from Accept-Language (i18n/request.ts). */}
            <span className="hidden md:block">
              <LocaleSwitch />
            </span>
            <a href="#cta" className={`${btnO} h-11 px-4 text-[13.5px] whitespace-nowrap md:px-[22px] md:text-sm`}>
              {t("navSignIn")}
            </a>
          </div>
        </SiteHeader>
        <span className={`relative mx-4 mt-2 self-end md:hidden ${ph}`}>Ảnh · placeholder</span>

        <div className="relative mt-auto flex flex-col gap-[22px] px-6 pb-9 md:mt-0 md:items-center md:gap-[30px] md:px-24 md:pt-[150px] md:pb-0 md:text-center">
          <h1 className="font-display text-[40px] leading-[1.14] font-light tracking-[0.01em] uppercase text-balance md:max-w-[1080px] md:text-[clamp(36px,5.2vw,74px)]">
            {t("headline")}
          </h1>
          <p className="text-base font-light leading-[1.6] text-pretty md:max-w-[560px] md:text-lg">{t("subtitle")}</p>
          <div id="cta" className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3.5">
            <span className="flex min-h-[52px] items-center justify-center">
              <GoogleSignIn locale={locale} />
            </span>
            <Link href="/demo" className={`${btnO} md:px-7`}>
              {t("tryDemo")}
            </Link>
          </div>
          <div className="flex flex-col gap-0.5 text-[11.5px] tracking-[0.06em] uppercase md:flex-row md:items-center md:gap-6 md:text-xs md:tracking-[0.08em]">
            <span>{t("finePrint")}</span>
            <a href={APK_URL} className="flex min-h-11 items-center">
              {t("downloadAndroid")} →
            </a>
          </div>
        </div>
        <span className={`absolute right-14 bottom-10 hidden md:block ${ph}`}>Ảnh full-bleed · placeholder</span>
      </section>

      <ScrollStage />

      <section id="how" className={`${section} flex flex-col gap-8 md:grid md:min-h-[820px] md:grid-cols-12 md:items-center md:gap-8`}>
        {/* The R3F particle face (scatter → face → five zones as the box scrolls through); the dotted
            placeholder stands in until three.js has loaded near the viewport, and for good without scripts. */}
        <div
          className="relative order-2 h-[342px] rounded-xl md:order-none md:col-span-6 md:h-[600px]"
          style={{ background: "radial-gradient(40% 45% at 50% 48%, color-mix(in oklab, var(--photo-c) 20%, transparent), transparent 72%)" }}
          aria-hidden
        >
          <ParticleFaceSlot labels={ZONES.map((zone) => tc(`zones.${zone}`))}>
            <svg viewBox="0 0 600 600" className="absolute inset-0 size-full stroke-foreground" fill="none" strokeLinecap="round">
              <g className="stroke-[5] [stroke-dasharray:0.1_14] md:stroke-[3] md:[stroke-dasharray:0.1_9]">
                <ellipse cx="300" cy="300" rx="170" ry="225" />
                <path d="M175 200 Q300 130 425 200" />
                <g strokeOpacity="0.7">
                  <ellipse cx="215" cy="320" rx="52" ry="62" />
                  <ellipse cx="385" cy="320" rx="52" ry="62" />
                  <path d="M300 250 L278 350 L322 350 Z" className="hidden md:block" />
                  <ellipse cx="300" cy="455" rx="62" ry="34" />
                </g>
              </g>
            </svg>
          </ParticleFaceSlot>
        </div>
        <div className="contents md:col-span-6 md:flex md:flex-col md:gap-9">
          <div className="order-1 flex flex-col gap-3 md:gap-3.5">
            <span className={lbl}>{t("howEyebrow")}</span>
            <h2 className={h2}>{t("howTitle")}</h2>
          </div>
          <ol className="order-3 flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-x-7 md:gap-y-8">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-1.5 border-t border-border pt-3.5 md:gap-2 md:pt-4">
                <span className="font-display text-base font-light text-muted-foreground md:text-[17px]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-[21px] md:text-[22px]">{s.title}</h3>
                <p className="text-[15px] font-light leading-[1.6] text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="ai" className={`${section} flex flex-col gap-6 md:grid md:min-h-[700px] md:grid-cols-12 md:items-center md:gap-8`}>
        <div className="flex flex-col gap-6 md:col-span-5 md:gap-[18px]">
          <span className={lbl}>{t("aiEyebrow")}</span>
          <h2 className={`${h2} text-balance`}>{t("aiTitle")}</h2>
          <p className="text-[15.5px] font-light leading-[1.7] text-pretty text-muted-foreground md:text-base">{t("aiBody")}</p>
        </div>
        <ol className="flex flex-col border-b border-border md:col-span-5 md:col-start-8">
          {aiSteps.map((s, i) => {
            const last = i === aiSteps.length - 1;
            return (
              <li key={s.title} className="grid grid-cols-[40px_minmax(0,1fr)] items-baseline border-t border-border py-4 md:grid-cols-[56px_minmax(0,1fr)] md:py-5">
                <span className={`font-display text-[22px] font-light md:text-[26px] ${last ? "" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="flex flex-col gap-0.5 md:gap-1">
                  <span className="text-[15px] font-medium md:text-base">{s.title}</span>
                  <span className="text-[13.5px] font-light text-muted-foreground md:text-sm">{s.body}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={`${section} flex flex-col gap-6 md:grid md:min-h-[640px] md:grid-cols-12 md:items-center md:gap-8`}>
        <div className="flex flex-col gap-6 md:col-span-8 md:gap-7">
          <h2 className={h2}>{t("compareTitle")}</h2>
          <div className={`${card} px-4 text-sm font-light md:px-6 md:text-[15px]`}>
            <table className="w-full text-left">
              <thead>
                <tr className={`h-12 md:h-[52px] ${lbl}`}>
                  <td className="w-[40%] md:w-[41%]" />
                  <th className="font-medium">
                    <span className="md:hidden">{t("compareWebShort")}</span>
                    <span className="hidden md:inline">{t("compareWeb")}</span>
                  </th>
                  <th className="font-medium">
                    <span className="md:hidden">{t("compareAndroidShort")}</span>
                    <span className="hidden md:inline">{t("compareAndroid")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.label} className="h-16 border-t border-border md:h-14">
                    <th className="pr-2 font-light">{r.label}</th>
                    {cell(r.web)}
                    {cell(r.android)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${card} flex flex-col gap-3 p-[22px] md:col-span-4 md:mt-20 md:items-center md:gap-3.5 md:p-7 md:text-center`}>
          {/* Static qrencode SVG of APK_URL, checked into public/: no QR library, no runtime request.
              Black on white is what scanners need, so it is not themed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apk-qr.svg" alt={t("qrAlt")} width={168} height={168} className="hidden size-[168px] rounded-[10px] md:block" />
          <span className="font-display text-[22px] md:text-2xl">
            <span className="md:hidden">{t("apkTitle")}</span>
            <span className="hidden md:inline">{t("qrTitle")}</span>
          </span>
          <span className="text-sm font-light leading-[1.55] text-muted-foreground">{t("qrBody")}</span>
          <a href={APK_URL} className={`${btnO} h-12`}>
            <CanvasIcon name="download" size={18} />
            {t("downloadAndroid")}
          </a>
        </div>
      </section>

      <section id="faq" className={`${section} flex flex-col gap-6 md:min-h-[780px] md:items-center md:gap-8 md:pt-24`}>
        <div className="flex flex-col gap-6 md:w-[800px] md:gap-8">
          <h2 className={h2}>{t("faqTitle")}</h2>
          <Accordion type="single" collapsible defaultValue={faq[0].q} className="border-b border-border">
            {faq.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="border-t border-border not-last:border-b-0">
                <AccordionTrigger className="min-h-[72px] items-center gap-3 rounded-none border-0 py-0 text-base font-medium hover:no-underline md:text-lg **:data-[slot=accordion-trigger-icon]:size-[18px] md:**:data-[slot=accordion-trigger-icon]:size-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[700px] pb-5 text-[14.5px] font-light leading-[1.7] text-muted-foreground md:pb-6 md:text-[15px]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section
        id="trust"
        className="flex min-h-[560px] flex-col items-center justify-center gap-4 border-t border-border bg-night px-6 py-16 text-center md:min-h-[440px] md:gap-[18px] md:px-24 md:py-0"
      >
        <span className="rounded-4xl border border-foreground/30 px-3.5 py-1.5 text-[12.5px] font-medium">{t("trustBadge")}</span>
        <h2 className="font-display text-[32px] leading-[1.2] font-light text-balance md:max-w-[760px] md:text-[44px]">{t("trustTitle")}</h2>
        <p className="text-[15px] font-light leading-[1.7] text-pretty md:max-w-[640px] md:text-base">{t("trustBody")}</p>
        <div className="flex flex-col gap-3 self-stretch pt-2 md:flex-row md:self-auto md:gap-3.5 md:pt-2.5">
          <a href="#cta" className={btn}>
            <CanvasIcon name="google" size={17} />
            {t("signInGoogle")}
          </a>
          <Link href="/demo" className={btnO}>
            {t("tryDemoShort")}
          </Link>
        </div>
      </section>

      <footer className="flex flex-col border-t border-border px-6 pt-5 pb-3 text-[13px] font-light md:h-[88px] md:flex-row md:items-center md:justify-between md:px-14 md:py-0">
        <span className="text-muted-foreground">© SkinSense</span>
        <span className="flex flex-col md:flex-row md:gap-6">
          <a href={APK_URL} className="flex min-h-11 items-center">
            {t("downloadAndroid")}
          </a>
          <Link href="/privacy" className="-mt-2 flex min-h-11 items-center md:mt-0">
            {t("privacyPolicy")}
          </Link>
        </span>
      </footer>
    </>
  );
}
