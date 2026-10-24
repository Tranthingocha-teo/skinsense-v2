"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { LogoMark } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const KEY = "skinsense-onboarded";
const POINTS = ["light", "webcam", "diagnosis"] as const;

// Canvas WebOnboarding (md up: photo column + three points) and PhoneOnboarding (390: full-bleed
// photo under a scrim). Both widths keep the ticket's one screen; the phone shows the points, not a pager.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useTranslations("Onboarding");
  const photo = useTranslations("Today")("photoPlaceholder");
  return (
    <main className="relative isolate flex min-h-svh flex-col md:h-svh md:flex-row md:overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-photo md:relative md:z-auto md:w-[680px] md:shrink-0">
        <div className="absolute inset-0 bg-linear-to-b from-background/25 via-background/30 via-40% to-background to-74% md:hidden" />
        <div className="absolute inset-0 hidden bg-linear-to-r from-transparent from-60% to-background md:block" />
        <span className="absolute top-4 left-5 rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px] md:top-auto md:bottom-8 md:left-8">
          {photo}
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-[22px] px-6 pt-20 pb-9 md:my-0 md:flex-1 md:justify-center md:gap-8 md:pt-0 md:pr-[120px] md:pb-0 md:pl-[72px]">
        <div className="hidden items-center gap-3 md:flex">
          <LogoMark className="size-8" />
          <span className="font-display text-[18px] tracking-[0.2em]">SKINSENSE</span>
        </div>
        <h1 className="font-display text-[44px] leading-[1.15] font-light text-balance md:text-[54px] md:leading-[1.12]">{t("title")}</h1>

        <ol className="flex flex-col border-b border-border">
          {POINTS.map((point, i) => (
            <li key={point} className="grid grid-cols-[48px_minmax(0,1fr)] border-t border-border py-[18px]">
              <span className="font-display text-2xl font-light text-muted-foreground">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="text-base font-medium">{t(`${point}Title`)}</span>
                <span className="text-[14.5px] leading-[1.55] font-light text-muted-foreground">{t(`${point}Body`)}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-5">
          <Button onClick={onDone} className="h-[52px] w-full rounded-lg px-6 text-[15px] font-medium md:w-auto">
            {t("start")}
          </Button>
          {/* One Skip: top-right over the photo at 390, beside Bắt đầu from md. */}
          <button type="button" onClick={onDone} className="absolute top-4 right-2 min-h-11 px-3 text-sm md:static md:px-0">
            {t("skip")}
          </button>
        </div>
      </div>
    </main>
  );
}

const subscribe = () => () => {};
// Storage that throws (disabled, private modes) counts as onboarded, like the Android gate.
const seen = () => {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
};

// Once per device: the app stays behind onboarding until Bắt đầu or Bỏ qua sets the local flag.
// The server renders the app (it can't read localStorage), so a first visit swaps in onboarding on hydration.
export function OnboardingGate({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, seen, () => true);
  const [done, setDone] = useState(false);
  if (stored || done) return children;
  return (
    <Onboarding
      onDone={() => {
        try {
          localStorage.setItem(KEY, "1");
        } catch {}
        setDone(true);
      }}
    />
  );
}
