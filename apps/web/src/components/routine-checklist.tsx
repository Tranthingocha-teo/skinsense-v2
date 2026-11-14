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
import { Sparkles, Sun, Moon, Info, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
  getProductForStep,
} from "@/lib/role-routines";
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
  // Time of Day: Morning vs Evening (Routine Sáng vs Routine Tối)
  // Auto-detect based on local hour: 5:00 - 16:59 is Morning, 17:00 - 4:59 is Evening
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "evening">(() => {
    if (typeof window === "undefined") return "evening";
    const hour = new Date().getHours();
    return hour >= 5 && hour < 17 ? "morning" : "evening";
  });
  const [supabaseProtocol, setSupabaseProtocol] = useState<any>(null);
  const [showUsageTips, setShowUsageTips] = useState<boolean>(true);
  const defaults = t.raw("defaults") as string[];

  // Fetch real routine data directly from Supabase API (/api/routine)
  useEffect(() => {
    if (typeof window === "undefined" || !window.location) return;
    fetch(`/api/routine?timeOfDay=${timeOfDay}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.ok && data.steps?.length > 0) {
          setSupabaseProtocol(data);
          // Set real items from Supabase protocol for morning or evening
          const realItems: RoutineItem[] = data.steps.map((s: any, idx: number) => ({
            id: s.id || `step-${timeOfDay}-${idx}`,
            label: s.label,
            position: idx,
          }));
          setItems(realItems);
          const realCompletedLabels = data.steps
            .filter((s: any) => s.isCompleted)
            .map((s: any) => s.label);
          setEntry((prev) => ({
            night: prev?.night || night || new Date().toISOString().split("T")[0],
            completed_labels: realCompletedLabels,
            item_count: realItems.length,
          }));
        }
      })
      .catch(() => {});
  }, [timeOfDay, night]);

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
    const isNowTicked = !ticked.has(item.label);
    const labels = items.filter((i) => (i.id === item.id ? isNowTicked : ticked.has(i.label))).map((i) => i.label);
    setEntry({ night, completed_labels: labels, item_count: items.length });
    persist(() => api.saveEntry(night, labels, items.length));

    // Optimistically update supabaseProtocol steps state
    if (supabaseProtocol?.steps) {
      setSupabaseProtocol((prev: any) => {
        if (!prev) return prev;
        const updatedSteps = prev.steps.map((s: any) =>
          s.label === item.label ? { ...s, isCompleted: isNowTicked } : s
        );
        const completedCount = updatedSteps.filter((s: any) => s.isCompleted).length;
        return {
          ...prev,
          steps: updatedSteps,
          completedCount,
          percent: Math.round((completedCount / updatedSteps.length) * 100),
        };
      });
    }

    // Also sync directly to Supabase Postgres routine_entries
    fetch("/api/routine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: item.label,
        isCompleted: isNowTicked,
        night,
        timeOfDay,
      }),
    }).catch(() => {});
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
    const supabaseStep = supabaseProtocol?.steps?.find(
      (s: any) => s.label.toLowerCase() === item.label.toLowerCase()
    ) || supabaseProtocol?.steps?.[index];
    const product = (supabaseStep && supabaseStep.productName) ? {
      id: supabaseStep.id || `step_${index}`,
      stepNumber: supabaseStep.stepNumber || index + 1,
      label: supabaseStep.label || item.label,
      productName: supabaseStep.productName,
      brand: supabaseStep.brand,
      category: supabaseStep.category,
      imageUrl: supabaseStep.imageUrl,
      activeIngredients: supabaseStep.activeIngredients,
      stepTime: supabaseStep.stepTime || timeOfDay,
      dosage: supabaseStep.dosage,
      usageGuide: supabaseStep.usageGuide,
    } : getProductForStep(item.label, timeOfDay, index);

    return (
      <li
        key={item.id}
        className="flex flex-col gap-2.5 py-3.5 border-t border-border first:border-t-0"
      >
        {/* Row Header with Checkbox and Tap target */}
        <div className="flex items-center justify-between gap-3">
          <label className={`flex min-w-0 items-center gap-3.5 self-stretch ${editing === item.id ? "pointer-events-none" : "flex-1 cursor-pointer"}`}>
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
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`text-[16px] sm:text-[17px] transition-colors ${isTicked ? "font-light text-muted-foreground line-through decoration-muted-foreground/40" : "font-semibold text-foreground/90"}`}>
                  {item.label}
                </span>
                {product.stepTime === "evening" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Moon className="size-2.5" />
                    <span>Tối</span>
                  </span>
                )}
                {product.stepTime === "morning" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sun className="size-2.5" />
                    <span>Sáng</span>
                  </span>
                )}
                {product.stepTime === "both" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Sun className="size-2.5" />
                    <span>Sáng & Tối</span>
                  </span>
                )}
                {isTicked && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                    Đã làm ✓
                  </span>
                )}
              </div>
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
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-foreground data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="5.5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.5" r="1.4" />
                </svg>
              </DropdownMenuTrigger>
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
        </div>

        {/* Product Details & Usage Guide Box */}
        {showUsageTips && editing !== item.id && (
          <div className="ml-9.5 p-3 rounded-xl border border-border/80 bg-surface-2/40 flex flex-col sm:flex-row gap-3">
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="size-14 sm:size-16 rounded-lg object-cover border border-border shrink-0 self-start"
            />
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-primary text-[10px] uppercase tracking-wider">
                  {product.brand}
                </span>
                <span className="text-muted-foreground text-[10px]">·</span>
                <span className="font-semibold text-foreground text-xs sm:text-[13px]">
                  {product.productName}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-foreground/80">Hoạt chất:</strong> {product.activeIngredients}
              </p>
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-card/70 px-2.5 py-1.5 rounded-lg border border-border/50">
                  <span className="font-bold text-primary">Liều lượng: </span>
                  <span className="text-foreground">{product.dosage}</span>
                </div>
                <div className="bg-card/70 px-2.5 py-1.5 rounded-lg border border-border/50">
                  <span className="font-bold text-primary">Cách dùng: </span>
                  <span className="text-foreground">{product.usageGuide}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </li>
    );
  });

  const rawTitle = t("title");
  const titleParts = rawTitle.split(/\s+/);
  const titleFirst = timeOfDay === "morning" ? (titleParts[0] === "Routine" ? "Routine" : "Morning") : (titleParts[0] ?? "Routine");
  const titleSecond = timeOfDay === "morning" ? (titleParts[0] === "Routine" ? "sáng nay" : "routine") : (titleParts.slice(1).join(" ") || "tối nay");

  const editLabel = t("edit");
  const editParts = editLabel.split(/\s+/);
  const editFirst = editParts[0] ?? editLabel;
  const editSecond = editParts.slice(1).join(" ") || "";

  if (embedded) {
    return (
      <div className="flex flex-col gap-3.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-5 motion-safe:animate-in fade-in">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="font-display text-[28px] sm:text-[32px] font-normal leading-[1.08] tracking-tight text-foreground">
              <span className="block">{titleFirst}</span>
              {titleSecond ? <span className="block">{titleSecond}</span> : null}
            </h2>
          </div>
          <Link
            href={appHref("/routine")}
            aria-label={editLabel}
            className="pt-1 text-right text-[13px] leading-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="block">{editFirst}</span>
            {editSecond ? <span className="block">{editSecond}</span> : null}
          </Link>
        </header>

        {/* Switcher Sáng vs Tối */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2/80 border border-border w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTimeOfDay("morning")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeOfDay === "morning"
                ? "bg-card text-foreground shadow-xs border border-border font-bold text-amber-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="size-3.5 text-amber-500" />
            <span>Routine Sáng</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeOfDay("evening")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeOfDay === "evening"
                ? "bg-card text-foreground shadow-xs border border-border font-bold text-indigo-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="size-3.5 text-indigo-400" />
            <span>Routine Tối</span>
          </button>
        </div>

        {/* Treatment Regimen Info Banner */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-primary">
              {supabaseProtocol?.isPrescribed ? (
                <>
                  <ShieldCheck className="size-3.5" />
                  <span>Phác đồ Y khoa {timeOfDay === "morning" ? "Buổi Sáng" : "Buổi Tối"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Routine Cá Nhân {timeOfDay === "morning" ? "Buổi Sáng" : "Buổi Tối"}</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {supabaseProtocol?.allocatedBy || "Dữ liệu riêng tư của bạn"}
            </span>
          </div>
          <h3 className="font-display text-xs sm:text-sm font-bold text-foreground">
            {supabaseProtocol?.title || (timeOfDay === "morning" ? "Routine Sáng: Cấp Ẩm & Bảo Vệ Da" : "Routine Tối: Làm Sạch Sâu & Phục Hồi")}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {supabaseProtocol?.description || (timeOfDay === "morning" ? "Làm sạch dịu nhẹ pH 5.5, cấp nước phục hồi và chống nắng bảo vệ da." : "Hòa tan bụi bẩn dầu nhờn, kháng khuẩn ngừa mụn và tái tạo màng ẩm tự nhiên ban đêm.")}
          </p>
        </div>

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
          <h1 className="font-display text-[34px] leading-[1.15] font-light md:text-[44px] md:leading-[1.2]">{titleFirst} {titleSecond}</h1>
        </header>

        <div className="flex flex-col gap-3.5 px-1 pt-1 pb-2 md:px-0">
          <span className="text-[11.5px] font-medium tracking-[0.14em] uppercase">
            {format.dateTime(new Date(night), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          </span>

          {/* Switcher Sáng vs Tối */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2/80 border border-border w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeOfDay("morning")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeOfDay === "morning"
                  ? "bg-card text-foreground shadow-xs border border-border font-bold text-amber-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="size-3.5 text-amber-500" />
              <span>Routine Sáng</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeOfDay("evening")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeOfDay === "evening"
                  ? "bg-card text-foreground shadow-xs border border-border font-bold text-indigo-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="size-3.5 text-indigo-400" />
              <span>Routine Tối</span>
            </button>
          </div>

          {/* Treatment Regimen Info Banner */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                {supabaseProtocol?.isPrescribed ? (
                  <>
                    <ShieldCheck className="size-3.5" />
                    <span>Phác đồ Y khoa {timeOfDay === "morning" ? "Buổi Sáng" : "Buổi Tối"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Routine Cá Nhân {timeOfDay === "morning" ? "Buổi Sáng" : "Buổi Tối"}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {supabaseProtocol?.allocatedBy || "Dữ liệu riêng tư của bạn"}
              </span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
              {supabaseProtocol?.title || (timeOfDay === "morning" ? "Routine Sáng: Cấp Ẩm & Bảo Vệ Da" : "Routine Tối: Làm Sạch Sâu & Phục Hồi")}
            </h3>
            <p className="text-[11.5px] text-muted-foreground leading-snug">
              {supabaseProtocol?.description || (timeOfDay === "morning" ? "Làm sạch dịu nhẹ pH 5.5, cấp nước phục hồi và chống nắng bảo vệ da." : "Hòa tan bụi bẩn dầu nhờn, kháng khuẩn ngừa mụn và tái tạo màng ẩm tự nhiên ban đêm.")}
            </p>
          </div>

          {progress}
        </div>

        <ul className="flex flex-col rounded-xl border border-foreground/10 bg-card py-2 pr-2 pl-4 sm:pl-5 md:pl-6">{rows}</ul>

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
