"use client";

import { isDuplicateRoutineLabel, localDay, routineCompletionPercent } from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useAppHref } from "@/components/app-nav";
import { LoadState } from "@/components/load-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type * as routineLib from "@/lib/routine";
import type { RoutineEntry, RoutineItem } from "@/lib/routine";

// The route binds these: Supabase-backed when signed in, browser storage in the demo.
export type RoutineApi = Pick<typeof routineLib, "loadRoutine" | "addItem" | "renameItem" | "deleteItem" | "swapPositions" | "saveEntry">;

// Canvas WebRoutine / PhoneRoutine (screen) and WebToday (embedded card).
const TINT =
  "pointer-events-none absolute inset-x-0 top-0 h-[240px] bg-[radial-gradient(60%_60%_at_75%_10%,color-mix(in_oklab,var(--photo-c)_30%,transparent),transparent_70%),linear-gradient(180deg,var(--photo-b),var(--background))] md:h-[300px] md:bg-[radial-gradient(40%_60%_at_80%_10%,color-mix(in_oklab,var(--photo-c)_30%,transparent),transparent_70%),linear-gradient(180deg,var(--photo-b),var(--background))]";
const FIELD = "h-10 w-full rounded-lg border bg-transparent px-2.5 text-[15.5px] outline-none";

// embedded: the tick-only card inside Hôm nay; editing stays on the routine screen.
export function RoutineChecklist({ api, embedded = false }: { api: RoutineApi; embedded?: boolean }) {
  const t = useTranslations("Routine");
  const format = useFormatter();
  const appHref = useAppHref();
  // Set after mount: client components still render on the server, where
  // "tonight" is the wrong date and would mismatch on hydration.
  const [night, setNight] = useState<string>();
  const [status, setStatus] = useState<"loading" | "failed" | "ready">("loading");
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [entry, setEntry] = useState<RoutineEntry | null>(null);
  // "new" = the add field at the end of the list; an id = that row's rename field.
  const [editing, setEditing] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const defaults = t.raw("defaults") as string[];

  const reload = useCallback(async (n: string) => {
    const loaded = await api.loadRoutine(n, defaults);
    setItems(loaded.items);
    setEntry(loaded.entry);
  }, [api, defaults]);

  useEffect(() => {
    const n = localDay(new Date());
    setNight(n);
    reload(n).then(() => setStatus("ready"), () => setStatus("failed"));
  }, [reload, attempt]);

  // Optimistic UI; a failed write reloads so the screen never shows an unsaved state.
  function persist(write: () => Promise<unknown>) {
    write().catch(() => {
      if (night) reload(night).catch(() => setStatus("failed"));
    });
  }

  const ticked = new Set(entry?.completed_labels ?? []);
  const done = items.filter((i) => ticked.has(i.label)).length;

  function edit(target: string | null) {
    setEditing(target);
    setDuplicate(false);
  }

  function toggle(item: RoutineItem) {
    if (!night) return;
    const labels = items.filter((i) => (i.id === item.id ? !ticked.has(i.label) : ticked.has(i.label))).map((i) => i.label);
    setEntry({ night, completed_labels: labels, item_count: items.length });
    persist(() => api.saveEntry(night, labels, items.length));
  }

  // Labels are tonight's snapshot key (ADR 0004): a duplicate keeps the field open with the error.
  function rename(item: RoutineItem, label: string) {
    if (label === "" || label === item.label) return edit(null);
    if (isDuplicateRoutineLabel(items, label, item.id)) return setDuplicate(true);
    edit(null);
    setItems(items.map((i) => (i.id === item.id ? { ...i, label } : i)));
    persist(() => api.renameItem(item.id, label));
  }

  function remove(item: RoutineItem) {
    setItems(items.filter((i) => i.id !== item.id));
    persist(() => api.deleteItem(item.id));
  }

  function move(index: number, delta: 1 | -1) {
    const a = items[index];
    const b = items[index + delta];
    if (!b) return;
    const next = [...items];
    next[index] = { ...b, position: a.position };
    next[index + delta] = { ...a, position: b.position };
    setItems(next);
    persist(() => api.swapPositions(a, b));
  }

  function add(label: string) {
    if (label === "") return edit(null);
    if (isDuplicateRoutineLabel(items, label)) return setDuplicate(true);
    edit(null);
    const position = (items.at(-1)?.position ?? -1) + 1;
    const tempId = `tmp-${position}`;
    setItems([...items, { id: tempId, label, position }]);
    persist(async () => {
      const saved = await api.addItem(label, position);
      setItems((cur) => cur.map((i) => (i.id === tempId ? saved : i)));
    });
  }

  if (!night || status !== "ready") {
    return <LoadState failed={status === "failed"} onRetry={() => { setStatus("loading"); retry(); }} />;
  }

  const error = duplicate && (
    <p role="alert" className="text-xs text-destructive">
      {t("duplicate")}
    </p>
  );

  const progress = (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-border/80">
        <div
          className="h-px bg-foreground transition-[width] duration-[360ms] motion-reduce:transition-none"
          style={{ width: `${routineCompletionPercent(done, items.length)}%` }}
        />
      </div>
      <span className="text-[12.5px] font-light whitespace-nowrap text-muted-foreground">
        {t("progress", { done, total: items.length })}
      </span>
    </div>
  );

  const rows = items.map((item, index) => {
    const isTicked = ticked.has(item.label);
    return (
      <li
        key={item.id}
        className={`flex items-center gap-3.5 ${embedded ? "h-13 py-2" : "min-h-14 border-t border-border first:border-t-0"}`}
      >
        {/* The whole row is the tap target (DESIGN.md), not the 22px circle. */}
        <label className={`flex min-w-0 items-center gap-4 self-stretch ${editing === item.id ? "pointer-events-none" : "flex-1 cursor-pointer"}`}>
          <input
            type="checkbox"
            className="peer sr-only"
            checked={isTicked}
            onChange={() => toggle(item)}
            aria-label={item.label}
          />
          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-foreground/45 text-transparent transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card hover:border-foreground/80">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          {editing !== item.id && (
            <span className={`min-w-0 flex-1 truncate text-[16px] sm:text-[17px] transition-colors ${isTicked ? "font-light text-muted-foreground line-through decoration-muted-foreground/40" : "font-normal text-foreground/90"}`}>{item.label}</span>
          )}
        </label>

        {editing === item.id && (
          <form
            className="-ml-2.5 flex flex-1 flex-col gap-1 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              rename(item, new FormData(e.currentTarget).get("label")!.toString().trim());
            }}
          >
            <input
              name="label"
              defaultValue={item.label}
              autoFocus
              aria-label={t("rename")}
              aria-invalid={duplicate || undefined}
              onChange={() => setDuplicate(false)}
              onBlur={(e) => rename(item, e.currentTarget.value.trim())}
              onKeyDown={(e) => e.key === "Escape" && edit(null)}
              className={`${FIELD} ${duplicate ? "border-destructive" : "border-foreground"}`}
            />
            {error}
          </form>
        )}

        {!embedded && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              aria-label={t("more", { label: item.label })}
              className="grid size-11 shrink-0 place-items-center rounded-4xl text-muted-foreground hover:text-foreground data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="12" cy="5.5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.5" r="1.4" />
              </svg>
            </DropdownMenuTrigger>
            {/* Non-modal + no close autofocus: the rename field opened from the menu keeps focus instead of the trigger. */}
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="w-[216px] rounded-lg border border-foreground/15 bg-surface-2 p-0 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.28)] ring-0"
            >
              <DropdownMenuLabel className="truncate px-4 pt-2 pb-1.5 text-[12.5px] font-medium text-muted-foreground">{item.label}</DropdownMenuLabel>
              {(
                [
                  ["rename", () => edit(item.id), false],
                  ["moveUp", () => move(index, -1), index === 0],
                  ["moveDown", () => move(index, 1), index === items.length - 1],
                ] as const
              ).map(([key, onSelect, disabled]) => (
                <DropdownMenuItem key={key} disabled={disabled} onSelect={onSelect} className="h-11 rounded-none px-4 text-[15px]">
                  {t(key)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem variant="destructive" onSelect={() => remove(item)} className="h-11 rounded-none border-t border-border px-4 text-[15px]">
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  });

  const rawTitle = t("title");
  const titleParts = rawTitle.split(/\s+/);
  const titleFirst = titleParts[0] ?? "Routine";
  const titleSecond = titleParts.slice(1).join(" ") || "";

  const editLabel = t("edit");
  const editParts = editLabel.split(/\s+/);
  const editFirst = editParts[0] ?? editLabel;
  const editSecond = editParts.slice(1).join(" ") || "";

  if (embedded) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4 motion-safe:animate-in fade-in">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="font-display text-[32px] sm:text-[34px] font-normal leading-[1.08] tracking-tight text-foreground">
              <span className="block">{titleFirst}</span>
              {titleSecond ? <span className="block">{titleSecond}</span> : null}
            </h2>
          </div>
          <Link
            href={appHref("/routine")}
            aria-label={editLabel}
            className="pt-1 text-right text-[13.5px] leading-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="block">{editFirst}</span>
            {editSecond ? <span className="block">{editSecond}</span> : null}
          </Link>
        </header>
        {progress}
        <ul className="flex flex-col pt-1">{rows}</ul>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col motion-safe:animate-in fade-in">
      <div aria-hidden className={TINT} />
      <div className="relative flex w-full max-w-[704px] flex-col gap-3 px-[18px] pt-4 pb-8 md:gap-4 md:px-16 md:py-14">
        <header className="-ml-2 flex items-center gap-1 md:-ml-3">
          <Link href={appHref("")} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="font-display text-[34px] leading-[1.15] font-light md:text-[44px] md:leading-[1.2]">{t("title")}</h1>
        </header>

        <div className="flex flex-col gap-3.5 px-1 pt-1 pb-2 md:px-0">
          <span className="text-[11.5px] font-medium tracking-[0.14em] uppercase">
            {format.dateTime(new Date(night), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          </span>
          {progress}
        </div>

        <ul className="flex flex-col rounded-xl border border-foreground/10 bg-card py-1 pr-2 pl-5 md:pl-6">{rows}</ul>

        {editing === "new" ? (
          <form
            className="flex flex-col gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              add(new FormData(e.currentTarget).get("label")!.toString().trim());
            }}
          >
            <input
              name="label"
              autoFocus
              placeholder={t("newStepPlaceholder")}
              aria-label={t("newStepPlaceholder")}
              aria-invalid={duplicate || undefined}
              onChange={() => setDuplicate(false)}
              onBlur={(e) => add(e.currentTarget.value.trim())}
              onKeyDown={(e) => e.key === "Escape" && edit(null)}
              className={`h-[54px] w-full rounded-lg border bg-transparent px-[18px] text-[15px] outline-none placeholder:font-light placeholder:text-muted-foreground md:px-5 ${duplicate ? "border-destructive" : "border-foreground"}`}
            />
            {error}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => edit("new")}
            className="flex h-[54px] w-full items-center gap-2.5 rounded-lg border border-dashed border-foreground/30 px-[18px] text-[15px] text-muted-foreground hover:bg-card md:px-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("addStep")}
          </button>
        )}
      </div>
    </div>
  );
}
