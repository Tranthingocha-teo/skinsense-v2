"use client";

import {
  comparisonPair,
  dailySeries,
  localDay,
  photoDays,
  routineCompletionPercent,
  trendDirection,
  windowDays,
  ZONES,
  type DayPoint,
  type Zone,
} from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { useAppHref } from "@/components/app-nav";
import { CompareDates } from "@/components/compare-dates";
import { ShareCompare } from "@/components/share-compare";
import { LoadState } from "@/components/load-state";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FLAT_TOLERANCE, type loadTrends, type signedPhotoUrls, type TrendData } from "@/lib/trends";

// The route binds these: Supabase-backed when signed in, generated sample data in the demo.
export type TrendsApi = { loadTrends: typeof loadTrends; signedPhotoUrls: typeof signedPhotoUrls };

// Canvas WebTrends / PhoneTrends: the night tint from Hôm nay, shallower (the photo lives in the compare card).
const TINT =
  "pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(60%_60%_at_75%_10%,color-mix(in_oklab,var(--photo-c)_35%,transparent),transparent_70%),linear-gradient(180deg,var(--photo-b),var(--background))] md:h-[320px] md:bg-[radial-gradient(40%_60%_at_80%_10%,color-mix(in_oklab,var(--photo-c)_35%,transparent),transparent_70%),linear-gradient(180deg,var(--photo-b),var(--background))]";
const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const CARD = "rounded-2xl border border-foreground/10 bg-card";
// Canvas .chip / .chip-on and the segmented control: 44px, radius control, filled accent when on.
const CHIP =
  "h-11 shrink-0 font-normal text-muted-foreground hover:bg-transparent hover:text-muted-foreground data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground";
const PILL = "rounded-4xl bg-background/60 px-2.5 py-[3px] text-[11px] font-medium tracking-[0.06em]";

const present = (series: DayPoint[]) => series.flatMap((p) => (p.value === null ? [] : [p.value]));
const dayDate = (day: string) => new Date(day + "T00:00:00");

// The series behind a chart, for screen readers (dataviz: a table view exists).
function SeriesTable({ points }: { points: [string, string][] }) {
  const t = useTranslations("Trends");
  return (
    <table className="sr-only">
      <thead>
        <tr>
          <th>{t("day")}</th>
          <th>{t("value")}</th>
        </tr>
      </thead>
      <tbody>
        {points.map(([day, value]) => (
          <tr key={day}>
            <td>{day}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Trends({ api }: { api: TrendsApi }) {
  const t = useTranslations("Trends");
  const tz = useTranslations("Capture.zones");
  const format = useFormatter();
  const appHref = useAppHref();
  // Server and client may disagree on "today", but both render null until data
  // loads, so nothing computed from it reaches the hydrated markup.
  const [today] = useState(() => localDay(new Date()));
  const [days, setDays] = useState<7 | 30>(7);
  const [zone, setZone] = useState<Zone>("forehead");
  const [data, setData] = useState<TrendData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [split, setSplit] = useState(50);
  // The user's two days; unset (or without Photos in this window) keeps the first/last pair.
  const [chosen, setChosen] = useState<[string, string]>();
  const pair = data ? comparisonPair(data.photos, chosen) : null;
  const pairKey = pair ? `${pair.before.storage_path}|${pair.after.storage_path}` : "";
  const [signed, setSigned] = useState<{ key: string; urls: string[] }>();
  const urls = signed?.key === pairKey ? signed.urls : [];

  useEffect(() => {
    let cancelled = false;
    api.loadTrends(windowDays(days, today)[0])
      .then((loaded) => !cancelled && setData(loaded))
      // Only a first load fails the screen; a window switch keeps what is shown.
      .catch(() => !cancelled && setData((d) => d ?? null));
    return () => {
      cancelled = true;
    };
  }, [api, today, days, attempt]);

  useEffect(() => {
    if (!pairKey) return;
    let cancelled = false;
    // A failed signing leaves the placeholder gradient under the date pills.
    api.signedPhotoUrls(pairKey.split("|")).then((u) => !cancelled && setSigned({ key: pairKey, urls: u }), () => {});
    return () => {
      cancelled = true;
    };
  }, [api, pairKey]);

  if (!data) return <LoadState failed={data === null} onRetry={() => { setData(undefined); retry(); }} />;

  const window = windowDays(days, today);
  const photoDay = new Map(data.photos.map((p) => [p.id, localDay(new Date(p.taken_at))]));
  const redness = dailySeries(
    window,
    data.readings.filter((r) => r.zone === zone).map((r) => ({ day: photoDay.get(r.photo_id)!, value: r.redness })),
  );
  // A day's spot count is its latest photo's count (the marked record), not a
  // mean over retakes; redness does average, since retakes only add noise.
  const lastPhotoOfDay = new Map(data.photos.map((p) => [photoDay.get(p.id)!, p.id]));
  const spotCount = dailySeries(
    window,
    [...lastPhotoOfDay].map(([day, id]) => ({ day, value: data.spots.filter((s) => s.photo_id === id && s.zone === zone).length })),
  );
  // Adherence over every night since the first ticked night in the window: a
  // night without an entry is 0%, not skipped; nights before the user started are.
  const routineDays = dailySeries(
    window,
    data.entries.map((e) => ({ day: e.night, value: routineCompletionPercent(e.completed_labels.length, e.item_count) })),
  );
  const nights = routineDays.slice(routineDays.findIndex((p) => p.value !== null));
  const routinePercent = nights.length ? Math.round(nights.reduce((sum, p) => sum + (p.value ?? 0), 0) / nights.length) : 0;

  const values = present(redness);
  const min = Math.min(0, ...values);
  const max = Math.max(min + 1, ...values);
  const lastIndex = redness.findLastIndex((p) => p.value !== null);
  const last = redness[lastIndex]?.value ?? undefined;
  const direction = trendDirection(redness, FLAT_TOLERANCE);
  const latestSpots = present(spotCount).at(-1);
  const spotPoints = spotCount.flatMap((p, i) => (p.value === null ? [] : [{ x: 2 + (i / Math.max(window.length - 1, 1)) * 76, v: p.value }]));
  const spotMax = Math.max(1, ...spotPoints.map((p) => p.v));
  const labelAt = (i: number) => days === 7 || (days - 1 - i) % 7 === 0; // 30 days: weekly, anchored on today
  const dayLabel = (day: string) => format.dateTime(dayDate(day), days === 7 ? { weekday: "short" } : { day: "numeric", month: "numeric" });
  const zoneName = tz(zone);

  // In the chart header on desktop, under the chart at phone width (canvas); the other copy is display:none.
  const latestPill = last !== undefined && (
    <span className="rounded-4xl border border-foreground/15 px-2.5 py-[3px] text-[11.5px]">
      {t.rich("latest", { value: last.toFixed(1), v: (chunks) => <span className="font-display text-[17px]">{chunks}</span> })}
    </span>
  );

  return (
    <div className="relative flex flex-1 flex-col motion-safe:animate-in fade-in">
      <div aria-hidden className={TINT} />
      <div className="relative flex w-full flex-col gap-3 px-[18px] pt-4 pb-8 md:gap-4 md:px-16 md:pt-16 md:pb-14">
        <header className="-ml-2 flex items-center gap-1 md:ml-0 md:pb-2">
          <Link href={appHref("")} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center md:hidden">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="flex-1 font-display text-[38px] leading-[1.15] font-light md:text-[54px] md:leading-[60px]">{t("title")}</h1>
          <ToggleGroup
            type="single"
            spacing={0}
            value={String(days)}
            onValueChange={(v) => v && setDays(Number(v) as 7 | 30)}
            className="shrink-0 rounded-lg border border-foreground/15"
          >
            {/* spacing=0 sets its own px-2 with a group variant, so the canvas padding needs the same variant. */}
            {([7, 30] as const).map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                className={`${CHIP} text-[12.5px] group-data-[spacing=0]/toggle-group:px-3 md:text-[13px] md:group-data-[spacing=0]/toggle-group:px-4`}
              >
                {t(`days${n}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </header>

        <ToggleGroup
          type="single"
          spacing={2}
          value={zone}
          onValueChange={(v) => v && setZone(v as Zone)}
          className="-mr-[18px] w-auto overflow-x-auto pr-[18px] md:mr-0 md:pr-0"
        >
          {ZONES.map((z) => (
            <ToggleGroupItem
              key={z}
              value={z}
              className={`${CHIP} rounded-lg border border-foreground/15 px-4 text-sm data-[state=on]:border-transparent md:px-[18px]`}
            >
              {tz(z)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-start md:gap-4 md:pt-2">
          <div className="flex flex-col gap-3 md:col-span-7 md:gap-4">
            {/* Glass: this card sits over the night tint (DESIGN.md). */}
            <section className="flex flex-col gap-2 rounded-2xl border border-foreground/15 bg-card/72 px-5 pt-[18px] pb-3 backdrop-blur-[18px] md:gap-2.5 md:px-6 md:pt-5 md:pb-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className={LABEL}>{t("redness", { zone: zoneName })}</h2>
                <div className="flex items-baseline gap-4">
                  <span className="hidden md:inline-flex">{latestPill}</span>
                  {direction && (
                    <span className={`text-xs font-medium ${direction === "down" ? "text-success" : "text-muted-foreground"}`}>{t(direction)}</span>
                  )}
                </div>
              </div>
              {last === undefined ? (
                <Empty className="h-[190px] p-0 md:h-[240px]">
                  <EmptyDescription className="text-sm font-light">{t("noData")}</EmptyDescription>
                </Empty>
              ) : (
                <>
                  <div role="img" aria-label={t("chartLabel", { zone: zoneName, count: values.length })}>
                    <ChartContainer config={{ value: { label: t("value") } }} className="h-[190px] w-full md:h-[240px]">
                      <LineChart accessibilityLayer={false} data={redness} margin={{ top: 6, right: 16, bottom: 0, left: 16 }}>
                        <YAxis hide domain={[min, max]} />
                        <ReferenceLine y={max} stroke="var(--border)" />
                        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 3" />
                        <XAxis
                          dataKey="day"
                          ticks={window.filter((_, i) => labelAt(i))}
                          interval={0}
                          tickFormatter={dayLabel}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tick={{ fontSize: 11, fontWeight: 300 }}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideIndicator
                              labelFormatter={(day) => format.dateTime(dayDate(String(day)), { day: "numeric", month: "short" })}
                              formatter={(value) => <span className="tabular-nums">{Number(value).toFixed(1)}</span>}
                            />
                          }
                        />
                        {/* A gap in the data is a gap in the line; the latest point is the filled one. */}
                        <Line
                          dataKey="value"
                          type="linear"
                          isAnimationActive={false}
                          stroke="var(--primary)"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dot={({ cx, cy, index, payload }: { cx?: number; cy?: number; index?: number; payload?: DayPoint }) =>
                            payload?.value === null ? (
                              <g key={index} />
                            ) : (
                              <circle key={index} cx={cx} cy={cy} r={4} strokeWidth={2} stroke="var(--primary)" fill={index === lastIndex ? "var(--primary)" : "var(--card)"} />
                            )
                          }
                          activeDot={{ r: 5, strokeWidth: 0, fill: "var(--primary)" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                  <SeriesTable points={redness.flatMap((p) => (p.value === null ? [] : [[p.day, p.value.toFixed(1)]]))} />
                  <div className="flex justify-end md:hidden">{latestPill}</div>
                </>
              )}
            </section>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className={`${CARD} flex flex-col px-[18px] py-3.5 md:px-[22px] md:py-4`}>
                <h2 className={LABEL}>{t("spots")}</h2>
                <p className="font-display text-[44px] leading-[1.1] font-light md:leading-[1.15]">
                  {latestSpots === undefined ? (
                    "—"
                  ) : (
                    <>
                      {Math.round(latestSpots)}
                      <span className="font-sans text-[13px] font-light text-muted-foreground"> {t("spotsUnit", { zone: zoneName })}</span>
                    </>
                  )}
                </p>
                {latestSpots !== undefined && (
                  <>
                    <SeriesTable points={spotCount.flatMap((p) => (p.value === null ? [] : [[p.day, String(p.value)]]))} />
                    <svg viewBox="0 0 80 24" className="h-5 w-16" aria-hidden>
                      <polyline
                        points={spotPoints.map((p) => `${p.x.toFixed(1)},${(20 - (p.v / spotMax) * 16).toFixed(1)}`).join(" ")}
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </div>
              <div className={`${CARD} flex flex-col px-[18px] py-3.5 md:px-[22px] md:py-4`}>
                <h2 className={LABEL}>{t("routine")}</h2>
                <p className="font-display text-[44px] leading-[1.1] font-light text-success md:leading-[1.15]">{routinePercent}%</p>
                <div className="mt-3 h-px bg-border">
                  <div className="h-px bg-success" style={{ width: `${routinePercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-5 md:gap-4">
            <section className={`${CARD} flex flex-col gap-3 p-5 pt-[18px] md:gap-3.5 md:p-6 md:pt-5`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={LABEL}>{t("compare")}</h2>
                {pair && (
                  <div className="flex items-center gap-1.5">
                    <CompareDates
                      photoDays={photoDays(window, data.photos)}
                      firstDay={window[0]}
                      today={today}
                      value={[localDay(new Date(pair.before.taken_at)), localDay(new Date(pair.after.taken_at))]}
                      onChange={setChosen}
                    />
                    {urls.length === 2 && (
                      <ShareCompare
                        beforeUrl={urls[0]}
                        afterUrl={urls[1]}
                        beforeDate={pair.before.taken_at}
                        afterDate={pair.after.taken_at}
                        rednessValue={redness[lastIndex]?.value ?? undefined}
                      />
                    )}
                  </div>
                )}
              </div>
              {pair ? (
                <div className="relative aspect-video overflow-hidden rounded-[10px] bg-photo md:aspect-[3/4] md:max-h-[460px]">
                  {urls.length === 2 && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urls[0]} alt="" className="absolute inset-0 size-full -scale-x-100 object-cover" />
                      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urls[1]} alt="" className="absolute inset-0 size-full -scale-x-100 object-cover" />
                      </div>
                    </>
                  )}
                  <span className={`absolute top-2.5 left-2.5 md:top-3 md:left-3 ${PILL}`}>
                    {format.dateTime(new Date(pair.before.taken_at), { day: "numeric", month: "short" })}
                  </span>
                  <span className={`absolute top-2.5 right-2.5 md:top-3 md:right-3 ${PILL}`}>
                    {format.dateTime(new Date(pair.after.taken_at), { day: "numeric", month: "short" })}
                  </span>
                  <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground" style={{ left: `${split}%` }} />
                  <div
                    className="pointer-events-none absolute top-1/2 grid size-11 -translate-1/2 place-items-center rounded-4xl border border-foreground/30 bg-background/60 text-foreground backdrop-blur-[12px]"
                    style={{ left: `${split}%` }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
                    </svg>
                  </div>
                  {/* Native range input over the image: the 44px thumb is the drag target. */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={split}
                    aria-label={t("slider")}
                    onChange={(e) => setSplit(e.currentTarget.valueAsNumber)}
                    className="absolute inset-0 m-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:size-11 [&::-webkit-slider-thumb]:size-11 [&::-webkit-slider-thumb]:appearance-none"
                  />
                </div>
              ) : (
                <Empty className="aspect-video rounded-[10px] border border-dashed border-border p-6 md:aspect-[3/4] md:max-h-[460px]">
                  <EmptyDescription className="text-sm font-light">{t("compareHint")}</EmptyDescription>
                </Empty>
              )}
            </section>
            <p className="text-center text-[11.5px] font-light text-muted-foreground">{t("disclaimer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
