"use client";

import { dailySeries, localDay, rednessShare, streak, trendDirection, windowDays, ZONES } from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useReducer, useState, type ReactNode } from "react";
import { useAppHref } from "@/components/app-nav";
import { LoadState } from "@/components/load-state";
import { RoutineChecklist, type RoutineApi } from "@/components/routine-checklist";
import { Skeleton } from "@/components/ui/skeleton";
import { FLAT_TOLERANCE, type loadTrends, type TrendData } from "@/lib/trends";

// The route binds these: Supabase-backed when signed in, generated sample data in the demo.
export type TodayApi = { loadTrends: typeof loadTrends; routine: RoutineApi };

// Canvas WebToday (1440) / PhoneToday (390): the night photo band, a labelled gradient until real photos exist.
const PHOTO =
  "bg-[radial-gradient(60%_50%_at_70%_18%,color-mix(in_oklab,var(--photo-c)_55%,transparent),transparent_70%),radial-gradient(90%_70%_at_20%_70%,var(--photo-a),transparent_75%),linear-gradient(180deg,var(--photo-b),var(--background))] md:bg-[radial-gradient(40%_55%_at_78%_18%,color-mix(in_oklab,var(--photo-c)_55%,transparent),transparent_70%),radial-gradient(60%_80%_at_18%_75%,var(--photo-a),transparent_75%),linear-gradient(180deg,var(--photo-b),var(--background))]";
const SCRIM = "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_25%,transparent),var(--background))]";
const CARD = "rounded-2xl border border-foreground/10 bg-card";
const GLASS = "rounded-2xl border border-foreground/14 bg-card/72 backdrop-blur-[18px]";
const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const LINK = "flex min-h-11 items-center text-[13px] underline underline-offset-4";

function Band({ photo }: { photo: boolean }) {
  const t = useTranslations("Today");
  if (!photo) return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-night md:h-[380px]" />;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] md:h-[480px]">
      <div className={`absolute inset-0 ${PHOTO}`} />
      <svg className="absolute inset-0 size-full opacity-[0.22] mix-blend-overlay md:hidden">
        <filter id="today-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#today-grain)" />
      </svg>
      <div className={`absolute inset-0 ${SCRIM}`} />
      <span className="absolute top-4 right-4 rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px] md:top-5 md:right-6">
        {t("photoPlaceholder")}
      </span>
    </div>
  );
}

function Frame({ photo, date, loading = false, children }: { photo: boolean; date?: string; loading?: boolean; children: ReactNode }) {
  const t = useTranslations("Today");
  const tc = useTranslations("Common");
  return (
    <div className="relative flex flex-1 flex-col motion-safe:animate-in fade-in">
      <Band photo={photo} />
      <div className="relative flex flex-1 flex-col gap-3 px-[18px] pt-16 pb-24 md:gap-4 md:px-16 md:pb-14" role={loading ? "status" : undefined}>
        <header className="flex flex-col gap-0.5 px-1 pb-[18px] md:px-0 md:pb-6">
          <span className="min-h-[17px] text-[11.5px] font-medium tracking-[0.14em] uppercase">{date}</span>
          <h1 className="font-display text-[54px] leading-[60px] font-light">{t("title")}</h1>
          {loading && <span className="pt-1.5 text-[13px] font-light text-muted-foreground">{tc("loading")}</span>}
        </header>
        {children}
      </div>
    </div>
  );
}

function StreakCard({ title, days, today, success = false }: { title: string; days: Set<string>; today: string; success?: boolean }) {
  const t = useTranslations("Today");
  const count = streak(days, today);
  return (
    <div className={`flex flex-col px-[18px] py-3.5 md:min-h-[176px] md:justify-between md:px-[22px] md:py-[18px] ${CARD} md:border-foreground/14 md:bg-card/72 md:backdrop-blur-[18px]`}>
      <h2 className={LABEL}>{title}</h2>
      <p className={`font-display text-[52px] leading-[1.15] font-light ${success ? "text-success" : ""}`}>
        {count}
        <span className="font-sans text-[13px] font-light whitespace-nowrap text-muted-foreground"> {t("nights", { count })}</span>
      </p>
    </div>
  );
}

// Canvas WebLoading / AndroidLoading: blocks the size of the real cards so nothing jumps when data lands.
const BLOCK = "rounded-2xl bg-foreground/7 motion-reduce:animate-none";
function Loading() {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-4">
      <Skeleton className={`h-[196px] md:col-span-7 md:h-44 ${BLOCK}`} />
      <div className="grid grid-cols-2 gap-3 md:col-span-5 md:gap-4">
        <Skeleton className={`h-[100px] md:h-44 ${BLOCK}`} />
        <Skeleton className={`h-[100px] md:h-44 ${BLOCK}`} />
      </div>
      <Skeleton className={`flex flex-col gap-[18px] px-5 py-[22px] md:col-span-5 md:h-[300px] ${BLOCK} bg-foreground/5`}>
        {["56%", "80%", "68%", "74%"].map((width, i) => (
          <span key={width} className={`block rounded-lg md:hidden ${i === 0 ? "h-3.5 bg-foreground/9" : "h-2.5 bg-foreground/7"}`} style={{ width }} />
        ))}
      </Skeleton>
      <Skeleton className={`hidden md:col-span-7 md:block md:h-[300px] ${BLOCK} bg-foreground/5`} />
    </div>
  );
}

export function Today({ api }: { api: TodayApi }) {
  const t = useTranslations("Today");
  const tt = useTranslations("Trends");
  const tc = useTranslations("Capture");
  const format = useFormatter();
  const appHref = useAppHref();
  // Set after mount: the server's "today" would mismatch the visitor's on hydration.
  const [today, setToday] = useState<string>();
  const [data, setData] = useState<TrendData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);

  useEffect(() => setToday(localDay(new Date())), []);
  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    // 90 days in one load: the streaks and the 7-day directions both derive from it.
    api.loadTrends(windowDays(90, today)[0]).then(
      (loaded) => !cancelled && setData(loaded),
      () => !cancelled && setData(null),
    );
    return () => {
      cancelled = true;
    };
  }, [api, today, attempt]);

  const date = today && format.dateTime(new Date(today), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  if (data === undefined || !today) {
    return (
      <Frame photo={false} date={date} loading>
        <Loading />
      </Frame>
    );
  }
  if (data === null) {
    return (
      <Frame photo={false} date={date}>
        <LoadState failed onRetry={() => { setData(undefined); retry(); }} />
      </Frame>
    );
  }

  const photoDay = new Map(data.photos.map((p) => [p.id, localDay(new Date(p.taken_at))]));
  const last = data.photos.at(-1);
  const tonight = last !== undefined && photoDay.get(last.id) === today;
  const week = windowDays(7, today);
  // ponytail: every Photo counts as camera-sourced until gallery import (spec row 25) adds photos.source.
  const captureDays = new Set(photoDay.values());
  const routineDays = new Set(data.entries.filter((e) => e.completed_labels.length > 0).map((e) => e.night));
  const latest = last ? data.readings.filter((r) => r.photo_id === last.id) : [];

  return (
    <Frame photo={last !== undefined} date={date}>
      <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-start md:gap-4">
        <section className={`flex flex-col gap-4 p-5 md:col-span-7 md:gap-[18px] md:p-6 ${last ? GLASS : CARD}`}>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-[28px] leading-[1.2] font-normal">{tonight ? t("tonightSaved") : t("noTonight")}</h2>
            <p className={`font-light text-muted-foreground ${last ? "text-[13px]" : "text-[13.5px] leading-normal md:text-sm"}`}>
              {last
                ? t("last", {
                    when: format.dateTime(new Date(last.taken_at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
                    count: data.spots.filter((s) => s.photo_id === last.id).length,
                  })
                : t("noPhoto")}
            </p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-7">
            <Link
              href={appHref("/capture")}
              className="flex h-[52px] items-center justify-center gap-2.5 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground md:h-12 md:px-6"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="7" width="18" height="13" rx="2.5" />
                <path d="M8 7l1.6-2.5h4.8L16 7" />
                <circle cx="12" cy="13.2" r="3.4" />
              </svg>
              {tonight ? t("captureAnother") : t("captureTonight")}
            </Link>
            {last && (
              <Link href={appHref(`/spots/${last.id}`)} className="-mt-2 flex min-h-11 items-center text-sm underline underline-offset-4 md:mt-0">
                {t("markSpots")}
              </Link>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 md:col-span-5 md:gap-4">
          <StreakCard title={t("captureStreak")} days={captureDays} today={today} />
          <StreakCard title={t("routineStreak")} days={routineDays} today={today} success />
        </div>

        <section className={`md:col-span-5 ${CARD}`}>
          <RoutineChecklist api={api.routine} embedded />
        </section>

        {last && (
          <section className={`flex flex-col px-5 pt-1.5 pb-3 md:col-span-7 md:px-6 md:pt-2 md:pb-3.5 ${CARD}`}>
            <div className="flex items-center justify-between">
              <h2 className={LABEL}>{t("redness7")}</h2>
              <Link href={appHref("/trends")} className={LINK}>
                {t("trends")}
              </Link>
            </div>
            {ZONES.map((zone) => {
              const reading = latest.find((r) => r.zone === zone);
              const series = dailySeries(
                week,
                data.readings.filter((r) => r.zone === zone).map((r) => ({ day: photoDay.get(r.photo_id)!, value: r.redness })),
              );
              const direction = trendDirection(series, FLAT_TOLERANCE);
              const good = direction === "down";
              return (
                <div
                  key={zone}
                  className="relative grid h-[42px] grid-cols-[minmax(0,1fr)_56px_108px] items-center border-t border-border text-[15px] font-light last:border-b md:h-11 md:grid-cols-[minmax(0,1fr)_80px_140px]"
                >
                  {/* DESIGN.md zone bar: the hairline under the row is the track, filled to the zone's share of tonight's highest reading. */}
                  {reading && (
                    <span aria-hidden className={`absolute -bottom-px left-0 h-px ${good ? "bg-success" : "bg-foreground"}`} style={{ width: `${rednessShare(reading.redness, latest.map((r) => r.redness)) * 100}%` }} />
                  )}
                  <span>{tc(`zones.${zone}`)}</span>
                  <span className="text-right font-display text-[22px]">{reading ? reading.redness.toFixed(1) : "—"}</span>
                  <span className={`text-right text-xs font-medium ${good ? "text-success" : "text-muted-foreground"}`}>{direction ? tt(direction) : "—"}</span>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </Frame>
  );
}
