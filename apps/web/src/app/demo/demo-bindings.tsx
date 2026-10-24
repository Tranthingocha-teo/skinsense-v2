"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { MarkSpots } from "@/components/mark-spots";
import { PhotoDetail } from "@/components/photo-detail";
import { PhotoHistory } from "@/components/photo-history";
import { RoutineChecklist } from "@/components/routine-checklist";
import { Today } from "@/components/today";
import { Trends } from "@/components/trends";
import { demoApi } from "@/lib/demo";

// The demo's counterpart of app/app/signed-in.tsx. Routine labels follow the
// locale so tonight's ticks match the generated items.
function useDemoApi() {
  const labels = useTranslations("Routine").raw("defaults") as string[];
  return useMemo(() => demoApi(labels), [labels]);
}

export function DemoToday() {
  return <Today api={useDemoApi()} />;
}

export function DemoTrends() {
  return <Trends api={useDemoApi()} />;
}

export function DemoRoutine() {
  return <RoutineChecklist api={useDemoApi().routine} />;
}

export function DemoMarkSpots({ photoId }: { photoId: string }) {
  return <MarkSpots photoId={photoId} api={useDemoApi()} />;
}

export function DemoHistory() {
  return <PhotoHistory api={useDemoApi()} />;
}

export function DemoPhotoDetail({ photoId }: { photoId: string }) {
  return <PhotoDetail photoId={photoId} api={useDemoApi()} />;
}
