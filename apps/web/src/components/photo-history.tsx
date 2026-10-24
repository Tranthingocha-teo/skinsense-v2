"use client";

import { filterHistory, groupByMonth, historyTags, type HistoryFilter } from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useAppHref } from "@/components/app-nav";
import { LoadState } from "@/components/load-state";
import { Empty, EmptyContent, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryPhoto, loadHistory } from "@/lib/history";

// The route binds these: Supabase-backed when signed in, generated sample data in the demo.
export type HistoryApi = { loadHistory: typeof loadHistory };

// Canvas WebHistory (1440) / PhoneHistory (390).
const CHIP = "flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm";

function TagIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8" cy="8" r="1.3" />
    </svg>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`${CHIP} ${on ? "bg-primary font-medium text-primary-foreground" : "border border-foreground/14 text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const PILL = "rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px]";
const GRID = "grid grid-cols-3 gap-1.5 md:grid-cols-6 md:gap-3";
const TILE = "relative block aspect-[3/4] overflow-hidden rounded-[6px] md:rounded-[10px]";
const MONTH_ROW = "flex items-center justify-between px-0.5 pt-5 pb-2.5 md:px-0 md:pt-3 md:pb-0";

function Loading() {
  const t = useTranslations("Common");
  return (
    <div role="status" className="flex flex-col md:gap-5">
      <span className="sr-only">{t("loading")}</span>
      <div className={MONTH_ROW}>
        <Skeleton className="h-3.5 w-20 rounded-lg bg-foreground/9 motion-reduce:animate-none" />
      </div>
      <div className={GRID}>
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className={`${TILE} bg-foreground/7 motion-reduce:animate-none`} />
        ))}
      </div>
    </div>
  );
}

export function PhotoHistory({ api }: { api: HistoryApi }) {
  const t = useTranslations("History");
  const tt = useTranslations("Today");
  const format = useFormatter();
  const appHref = useAppHref();
  const [photos, setPhotos] = useState<HistoryPhoto[] | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    let cancelled = false;
    api.loadHistory().then(
      (loaded) => !cancelled && setPhotos(loaded),
      () => !cancelled && setPhotos(null),
    );
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  const shown = photos && filterHistory(photos, filter);
  const placeholder = photos?.some((p) => !p.url);
  const thisYear = new Date().getFullYear();

  return (
    <main className="flex flex-1 flex-col px-[18px] pt-4 pb-6 motion-safe:animate-in fade-in md:gap-5 md:px-16 md:py-14">
      <div className="flex items-center justify-between">
        <header className="-ml-2 flex items-center gap-1 md:-ml-3">
          <Link href={appHref("/settings")} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="font-display text-[34px] leading-[1.15] font-light md:text-[44px] md:leading-[1.2]">{t("title")}</h1>
        </header>
        {placeholder && <span className={`hidden md:inline ${PILL}`}>{tt("photoPlaceholder")}</span>}
      </div>

      {photos === undefined && <Loading />}
      {photos === null && (
        <LoadState
          failed
          onRetry={() => {
            setPhotos(undefined);
            retry();
          }}
        />
      )}
      {photos?.length === 0 && (
        <Empty className="gap-5 py-16">
          <EmptyDescription className="max-w-[320px] text-[15.5px] leading-[1.55] font-light text-foreground">{tt("noPhoto")}</EmptyDescription>
          <EmptyContent>
            <Link href={appHref("/capture")} className="flex h-[52px] items-center justify-center rounded-lg bg-primary px-6 text-[15px] font-medium text-primary-foreground md:h-12">
              {tt("captureTonight")}
            </Link>
          </EmptyContent>
        </Empty>
      )}

      {!!photos?.length && (
        <div role="group" aria-label={t("filters")} className="-mr-[18px] flex gap-2 overflow-x-auto pt-3 [scrollbar-width:none] md:mr-0 md:pt-0">
          <Chip on={filter === "all"} onClick={() => setFilter("all")}>
            {t("all")}
          </Chip>
          {historyTags(photos).map((tag) => (
            <Chip key={tag} on={typeof filter === "object" && filter.tag === tag} onClick={() => setFilter({ tag })}>
              <TagIcon />
              {tag}
            </Chip>
          ))}
          <Chip on={filter === "note"} onClick={() => setFilter("note")}>
            {t("hasNote")}
          </Chip>
        </div>
      )}
      {!!photos?.length && shown!.length === 0 && <p className="py-16 text-center text-[15.5px] leading-[1.55] font-light">{t("noMatch")}</p>}

      {shown &&
        groupByMonth(shown).map(({ month, photos: list }) => {
          const [y, m] = month.split("-").map(Number);
          return (
            <section key={month} className="flex flex-col md:gap-5">
              <div className={MONTH_ROW}>
                {/* Mid-month, so no timezone shift can move the label into a neighbouring month. */}
                <h2 className={LABEL}>{format.dateTime(new Date(y, m - 1, 15), { month: "long", year: y === thisYear ? undefined : "numeric" })}</h2>
                <span className="text-[12.5px] font-light text-muted-foreground md:text-[13px]">{t("photos", { count: list.length })}</span>
              </div>
              <ul className={GRID}>
                {list.map((photo) => {
                  const date = format.dateTime(new Date(photo.taken_at), { day: "numeric", month: "short" });
                  const spots = t("spots", { count: photo.spotCount });
                  return (
                    <li key={photo.id}>
                      <Link href={appHref(`/photos/${photo.id}`)} aria-label={`${date}, ${spots}`} className={`${TILE} bg-photo`}>
                        {photo.url && (
                          // eslint-disable-next-line @next/next/no-img-element -- mirrored like every stored photo on screen (ticket 07)
                          <img src={photo.url} alt="" loading="lazy" className="absolute inset-0 size-full -scale-x-100 object-cover" />
                        )}
                        {photo.tags.length > 0 && <TagIcon className="absolute top-1.5 right-1.5 size-3.5 md:top-2 md:right-2 md:size-[15px]" />}
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--background)_82%,transparent))] px-[7px] pt-4 pb-1.5 text-[11px] font-medium md:px-2.5 md:pt-5 md:pb-2 md:text-xs"
                        >
                          <span>{date}</span>
                          <span>{spots}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      {placeholder && <span className={`mt-3 self-start md:hidden ${PILL}`}>{tt("photoPlaceholder")}</span>}
    </main>
  );
}
