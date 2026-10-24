"use client";

import { localDay } from "@skinsense/domain";
import { useFormatter, useTranslations, type DateTimeFormatOptions } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

// Canvas WebCompare (Dialog) / PhoneCompare (Drawer): pick the before and after days
// on a month calendar that enables only days with Photos.
type Pair = [string, string];

const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const local = (day: string) => new Date(day + "T00:00:00");
const ordered = ([a, b]: Pair): Pair => (a <= b ? [a, b] : [b, a]);

export function CompareDates({
  photoDays,
  firstDay,
  today,
  value,
  onChange,
}: {
  photoDays: string[]; // days of the range that have Photos
  firstDay: string; // the range's first day, the earliest month to show
  today: string;
  value: Pair; // the pair on screen
  onChange: (pair: Pair) => void;
}) {
  const t = useTranslations("Trends");
  const format = useFormatter();
  const phone = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [slot, setSlot] = useState<0 | 1>(0);
  const [month, setMonth] = useState(() => local(value[1]));
  const enabled = new Set(photoDays);
  // A day string names a calendar date, not an instant: format it in UTC so the runtime zone cannot shift it.
  const dayText = (day: string, options: DateTimeFormatOptions) =>
    format.dateTime(new Date(day + "T00:00:00Z"), { ...options, timeZone: "UTC" });

  const openChange = (next: boolean) => {
    if (next) {
      setDraft(value);
      setSlot(0);
      setMonth(local(value[1]));
    }
    setOpen(next);
  };
  const pick = (day: string) => {
    setDraft((d) => ordered(slot === 0 ? [day, d[1]] : [d[0], day]));
    setSlot(1);
  };

  const trigger = (
    <button type="button" className="-my-3 -mr-2 inline-flex h-11 items-center gap-1.5 px-2 text-[13px] font-medium">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
      {t("choose")}
    </button>
  );

  const body = (
    <>
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={slot === i}
            onClick={() => setSlot(i)}
            className={`flex h-14 flex-col items-start justify-center rounded-lg border px-3.5 text-left ${slot === i ? "border-foreground" : "border-foreground/14"}`}
          >
            <span className={LABEL}>{t(i === 0 ? "before" : "after")}</span>
            <span className="text-[15px] font-medium">{dayText(draft[i], { day: "numeric", month: "short" })}</span>
          </button>
        ))}
      </div>
      <Calendar
        mode="multiple"
        selected={draft.map(local)}
        onSelect={(_, date) => pick(localDay(date))}
        disabled={(date) => !enabled.has(localDay(date))}
        modifiers={{ photo: (date) => enabled.has(localDay(date)), future: { after: local(today) } }}
        today={local(today)}
        month={month}
        onMonthChange={setMonth}
        startMonth={local(firstDay)}
        endMonth={local(today)}
        weekStartsOn={1}
        showOutsideDays={false}
        formatters={{
          formatCaption: (d) => {
            const caption = format.dateTime(d, { month: "long", year: "numeric" });
            return caption.charAt(0).toUpperCase() + caption.slice(1);
          },
          formatWeekdayName: (d) => format.dateTime(d, { weekday: "narrow" }),
        }}
        labels={{
          labelPrevious: () => t("prevMonth"),
          labelNext: () => t("nextMonth"),
          labelDayButton: (date, m) => {
            const text = dayText(localDay(date), { day: "numeric", month: "long", year: "numeric" });
            return m.today ? `${text}, ${t("today")}` : text;
          },
        }}
        className="w-full bg-transparent p-0 [--cell-size:--spacing(11)]"
        classNames={{
          root: "w-full",
          month_caption: "flex h-11 items-center justify-center text-[15px] font-medium",
          caption_label: "text-[15px] font-medium",
          weekday: `flex-1 pb-1.5 ${LABEL}`,
          week: "mt-0.5 flex w-full",
          day: "relative h-11 flex-1 p-0 text-center",
          today: "font-semibold",
          disabled: "",
          outside: "",
        }}
        modifiersClassNames={{ future: "text-muted-foreground" }}
        components={{
          DayButton: ({ children, modifiers, className, ...props }) => (
            <CalendarDayButton
              modifiers={modifiers}
              {...props}
              className={`mx-auto size-11 min-w-0 gap-[3px] rounded-4xl text-sm font-[inherit] hover:bg-transparent disabled:opacity-100 data-[selected-single=true]:font-medium [&>span]:opacity-100 ${className ?? ""}`}
            >
              {children}
              {modifiers.photo && <span aria-hidden className="size-1 rounded-4xl bg-current" />}
            </CalendarDayButton>
          ),
        }}
      />
    </>
  );

  const apply = (className: string) => (
    <Button disabled={draft[0] === draft[1]} onClick={() => onChange(draft)} className={`rounded-lg px-6 text-[15px] font-medium ${className}`}>
      {t("apply")}
    </Button>
  );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={openChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="gap-3.5 rounded-t-xl border-foreground/14 bg-card px-5 pt-2.5 pb-7 [&>div:first-child]:mt-0 [&>div:first-child]:w-10 [&>div:first-child]:bg-border">
          <div className="flex flex-col gap-1">
            <DrawerTitle className="font-display text-[26px] font-normal">{t("choose")}</DrawerTitle>
            <DrawerDescription className="text-[13px] font-light">{t("chooseHint")}</DrawerDescription>
          </div>
          {body}
          <DrawerClose asChild>{apply("h-[52px] w-full")}</DrawerClose>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false} className="flex flex-col gap-3.5 rounded-2xl bg-surface-2 px-7 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:max-w-[440px]">
        <div className="flex flex-col gap-1">
          <DialogTitle className="font-display text-[26px] leading-normal font-normal">{t("choose")}</DialogTitle>
          <DialogDescription className="text-[13px] font-light">{t("chooseHint")}</DialogDescription>
        </div>
        {body}
        <div className="flex justify-end gap-2.5 pt-1.5">
          <DialogClose asChild>
            <Button variant="outline" className="h-12 rounded-lg border-foreground/55 bg-transparent px-6 text-[15px] font-normal hover:bg-transparent dark:border-foreground/55 dark:bg-transparent">
              {t("cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild>{apply("h-12")}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
