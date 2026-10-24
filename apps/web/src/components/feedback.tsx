"use client";

import { FEEDBACK_KINDS, FEEDBACK_MESSAGE_MAX, feedbackMessageError, type FeedbackKind } from "@skinsense/domain";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { AlertIcon } from "@/components/settings";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { deviceInfo, sendFeedback } from "@/lib/feedback";

// The route binds these: Supabase-backed when signed in, inert on the dev fixture page.
export type FeedbackApi = { sendFeedback: typeof sendFeedback; deviceInfo: typeof deviceInfo };


// Canvas WebFeedback / WebFeedbackError (1440) and PhoneFeedback (390). Sent = WebFeedbackSent:
// back on Cài đặt with a toast (the Toaster lives in the root layout so it survives the navigation).
export function Feedback({ api }: { api: FeedbackApi }) {
  const t = useTranslations("Feedback");
  const router = useRouter();
  // /app/settings/feedback → /app/settings; the dev fixture sits at /dev/settings/feedback.
  const settingsHref = usePathname().replace(/\/feedback$/, "");
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [attach, setAttach] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const invalid = feedbackMessageError(message);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    try {
      const device = attach ? api.deviceInfo() : { appVersion: null, deviceNote: null };
      await api.sendFeedback({ kind, message: message.trim(), ...device });
      toast.success(t("sent"));
      router.push(settingsHref);
    } catch {
      setState("error");
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-7 motion-safe:animate-in fade-in md:gap-5 md:px-16 md:py-14">
      <header className="-ml-2.5 flex items-center gap-1 md:-ml-3">
        <Link href={settingsHref} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="font-display text-[34px] leading-[1.15] font-light md:text-[44px] md:leading-[1.2]">{t("title")}</h1>
      </header>

      <form onSubmit={send} className="flex flex-1 flex-col gap-3.5 md:w-[600px] md:flex-none md:gap-4">
        <ToggleGroup
          type="single"
          spacing={0}
          value={kind}
          aria-label={t("kind")}
          onValueChange={(k) => k && setKind(k as FeedbackKind)}
          className="grid w-full grid-cols-3 rounded-lg border border-foreground/15"
        >
          {FEEDBACK_KINDS.map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className="h-11 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-muted-foreground data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground"
            >
              {t(k)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Field className="gap-3.5 md:gap-4">
          <FieldLabel htmlFor="feedback-message" className="px-1 pt-2 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase md:px-0">
            {t("message")}
          </FieldLabel>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
            aria-invalid={invalid === "tooLong"}
            className="min-h-[200px] resize-none rounded-2xl border-foreground/30 bg-card px-[18px] py-4 text-[15px] leading-[1.55] font-light md:min-h-[240px] md:px-5 md:py-[18px] md:text-[15px] dark:bg-card"
          />
          {invalid === "tooLong" && <p className="px-1 text-sm text-destructive md:px-0">{t("tooLong", { max: FEEDBACK_MESSAGE_MAX })}</p>}
        </Field>

        <label className="flex min-h-12 items-center gap-3.5 px-1 text-[14.5px] font-light md:px-0">
          <Checkbox
            checked={attach}
            onCheckedChange={(c) => setAttach(c === true)}
            className="size-[22px] rounded-4xl border-foreground [&_svg]:size-3 [&_svg]:stroke-[2.6]"
          />
          {t("attach")}
        </label>
        <p className="px-1 text-[12.5px] leading-[1.5] font-light text-muted-foreground md:px-0">{t("noData")}</p>

        <div className="mt-auto flex flex-col gap-3 md:mt-0 md:gap-4">
          {state === "error" && (
            <p role="alert" className="flex items-center justify-center gap-2 text-sm text-destructive md:justify-start md:pt-1">
              <AlertIcon size={16} />
              {t("error")}
            </p>
          )}
          <Button
            type="submit"
            disabled={invalid !== null || state === "sending"}
            className="h-[52px] w-full rounded-lg px-6 text-[15px] font-medium md:mt-2 md:w-auto md:self-start"
          >
            {t("send")}
          </Button>
        </div>
      </form>
    </main>
  );
}
