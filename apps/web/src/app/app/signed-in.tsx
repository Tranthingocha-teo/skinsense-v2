"use client";

import { Feedback } from "@/components/feedback";
import { RoutineChecklist } from "@/components/routine-checklist";
import { MarkSpots } from "@/components/mark-spots";
import { PhotoDetail } from "@/components/photo-detail";
import { PhotoHistory } from "@/components/photo-history";
import { Settings, type Account } from "@/components/settings";
import { Today, type TodayApi } from "@/components/today";
import { Trends, type TrendsApi } from "@/components/trends";
import * as account from "@/lib/account";
import * as history from "@/lib/history";
import * as feedback from "@/lib/feedback";
import * as photos from "@/lib/photos";
import * as routine from "@/lib/routine";
import { loadTrends, signedPhotoUrls } from "@/lib/trends";

// Functions can't be passed from a server page to a client component, so the
// Supabase-backed lib functions are bound here; the demo route binds its own.
const todayApi: TodayApi = { loadTrends, routine };
const trendsApi: TrendsApi = { loadTrends, signedPhotoUrls };

export function SignedInToday() {
  return <Today api={todayApi} />;
}

export function SignedInTrends() {
  return <Trends api={trendsApi} />;
}

export function SignedInRoutine() {
  return <RoutineChecklist api={routine} />;
}

export function SignedInMarkSpots({ photoId }: { photoId: string }) {
  return <MarkSpots photoId={photoId} api={photos} />;
}

export function SignedInHistory() {
  return <PhotoHistory api={history} />;
}

export function SignedInPhotoDetail({ photoId }: { photoId: string }) {
  return <PhotoDetail photoId={photoId} api={history} />;
}

export function SignedInSettings({ account: user }: { account: Account }) {
  return <Settings account={user} api={account} />;
}

export function SignedInFeedback() {
  return <Feedback api={feedback} />;
}
