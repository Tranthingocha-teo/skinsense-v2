import { useTranslations } from "next-intl";
import { StageMotion } from "./stage-motion-loader";
import { StageScreen } from "./stage-screen";

// Canvas WebLanding / PhoneLanding section 2 (scene 2 still): the real Hôm nay in a phone
// with floating data cards. Static as drawn until stage-motion.tsx scrubs it; the
// motion first-paint layout (400svh track, sticky stage, phone below, cards hidden) is
// globals.css under `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`.
// The whole stage is a mockup: aria-hidden and inert, counters carry their final value.
const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const CARD = "stage-card absolute flex flex-col gap-0.5 rounded-xl border border-foreground/14 bg-card/72 px-4 py-3.5 backdrop-blur-[18px] md:px-[22px] md:py-[18px]";
const VALUE = "font-display text-[40px] leading-[1.15] font-light md:text-[52px]";
const UNIT = "font-sans text-xs font-light text-muted-foreground md:text-[13px]";

export function ScrollStage() {
  const t = useTranslations("Landing");
  const scenes = [t("sceneCapture"), t("sceneMark"), t("sceneTrend")];
  return (
    <section className="stage-track border-t border-border" aria-hidden inert>
      <div className="stage relative flex min-h-[780px] flex-col overflow-hidden md:min-h-[960px]">
        <div className="absolute inset-0 bg-night opacity-70" />
        <ol className="stage-steps relative flex flex-col gap-2.5 px-6 pt-9 text-[13px] font-light md:grid md:w-[720px] md:grid-cols-3 md:gap-8 md:px-14 md:pt-12">
          {scenes.map((scene, i) => (
            <li
              key={scene}
              data-active={i === 1}
              className="text-muted-foreground data-[active=true]:border-l data-[active=true]:border-foreground data-[active=true]:pl-3 data-[active=true]:text-foreground md:border-t md:border-foreground/35 md:pt-3 md:text-foreground md:data-[active=true]:border-t md:data-[active=true]:border-l-0 md:data-[active=true]:pl-0"
            >
              <span className="md:text-muted-foreground">{String(i + 1).padStart(2, "0")}</span> {scene}
            </li>
          ))}
        </ol>

        <div className="relative flex flex-1 items-center justify-center pt-8 pb-10 md:pt-0">
          <div className="stage-phone-wrap relative h-[520px] w-[250px] md:h-[700px] md:w-[340px]">
            <div className="stage-phone relative size-full overflow-hidden rounded-[36px] border border-foreground/20 bg-background shadow-[0_30px_70px] shadow-black/35 md:rounded-[44px] md:shadow-[0_40px_100px]">
              <StageScreen />
            </div>

            <div className={`${CARD} top-[120px] left-[-54px] w-[150px] md:top-[90px] md:left-[-300px] md:w-[240px]`} data-depth="1.4">
              <span className={LABEL}>{t("cardForehead")}</span>
              <span className={VALUE} data-count="3.1" data-digits="1">3.1</span>
              <span className="text-xs font-medium text-success md:text-[12.5px]">{t("cardDown")}</span>
            </div>
            <div className={`${CARD} top-[380px] right-[-54px] w-[150px] md:top-[450px] md:right-auto md:left-[-260px] md:w-[220px]`} data-depth="0.8">
              <span className={LABEL}>{t("cardStreak")}</span>
              <span className={`${VALUE} text-success`}>
                <span data-count="8">8</span>
                <span className={UNIT}> {t("cardNights")}</span>
              </span>
            </div>
            <div className={`${CARD} hidden md:top-[130px] md:right-[-290px] md:flex md:w-[230px]`} data-depth="1">
              <span className={LABEL}>{t("cardLastNight")}</span>
              <span className={VALUE}>
                <span data-count="3">3</span>
                <span className={UNIT}> {t("cardSpots")}</span>
              </span>
            </div>
            <div className={`${CARD} hidden gap-2.5 md:top-[470px] md:right-[-300px] md:flex md:w-[260px]`} data-depth="1.8">
              <span className={LABEL}>{t("cardSpark")}</span>
              <svg viewBox="0 0 216 56" className="block h-auto w-full">
                <path className="stage-spark stroke-foreground" pathLength={1} d="M4 8 L38 14 M106 20 L140 18 L174 34" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="174" cy="34" r="3.5" className="fill-foreground" />
                <line x1="4" x2="212" y1="52" y2="52" strokeDasharray="2 3" className="stroke-muted-foreground" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <StageMotion />
    </section>
  );
}
