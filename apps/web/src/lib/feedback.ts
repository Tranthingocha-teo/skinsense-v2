import type { FeedbackKind } from "@skinsense/domain";
import { version } from "../../package.json";
import { createClient } from "@/lib/supabase/client";

export type FeedbackInput = { kind: FeedbackKind; message: string; appVersion: string | null; deviceNote: string | null };

// Straight into the owner-insert RLS policy (user_id defaults to auth.uid()); no Edge Function.
export async function sendFeedback({ kind, message, appVersion, deviceNote }: FeedbackInput) {
  const { error } = await createClient()
    .from("feedback")
    .insert({ kind, message, platform: "web", app_version: appVersion, device_note: deviceNote });
  if (error) throw new Error(error.message);
}

export function deviceInfo() {
  return { appVersion: version, deviceNote: navigator.userAgent };
}
