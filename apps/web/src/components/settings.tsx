"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { deleteAccount, signOut } from "@/lib/account";

// The route binds these: Supabase-backed when signed in, inert on the dev fixture page.
export type SettingsApi = { deleteAccount: typeof deleteAccount; signOut: typeof signOut };
export type Account = { name?: string; email: string; picture?: string };

// Canvas WebSettings (1440) / PhoneSettings (390). Feature rows (photo history, export,
// feedback, reminder, lock, about) are added by their own tickets: each one is a new
// <Row> inside the Group it belongs to, or a new Group in the column the canvas puts it.
const CARD = "rounded-2xl border border-foreground/10 bg-card";
const LABEL = "px-1 pt-2.5 text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground md:pt-3";
const ROW = "min-h-14 w-full flex-nowrap justify-between gap-3 rounded-none border-0 p-0 text-[15px] font-normal";
const HIT = "flex size-11 shrink-0 items-center justify-center text-muted-foreground";
const CHIP =
  "h-11 shrink-0 font-normal text-muted-foreground hover:bg-transparent hover:text-muted-foreground data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground";
const LANGUAGES = [
  ["vi", "Tiếng Việt"],
  ["en", "English"],
] as const;

function Group({ label, className = "px-[18px] md:px-[22px]", children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      {label && <h2 className={LABEL}>{label}</h2>}
      <div className={`flex flex-col divide-y divide-border ${CARD} ${className}`}>{children}</div>
    </section>
  );
}

export function AlertIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.4v.2" />
    </svg>
  );
}

// Writes the cookie i18n/request.ts reads, then re-renders the server components in the new language.
function LanguageRow() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  return (
    <Item className={ROW}>
      {t("language")}
      <ToggleGroup
        type="single"
        spacing={0}
        value={locale}
        aria-label={t("languageLabel")}
        onValueChange={(l) => {
          if (!l) return;
          document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="shrink-0 rounded-lg border border-foreground/15"
      >
        {LANGUAGES.map(([code, label]) => (
          <ToggleGroupItem key={code} value={code} className={`${CHIP} text-[13px] group-data-[spacing=0]/toggle-group:px-3.5 md:group-data-[spacing=0]/toggle-group:px-4`}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Item>
  );
}

// Canvas WebDelete / AndroidDelete (phone width), WebDeleting: the dialog stays open while
// deleting and on failure; it only closes through Hủy or Escape when idle.
function DeleteAccountRow({ onDelete }: { onDelete: () => Promise<void> }) {
  const t = useTranslations("Account");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "deleting" | "error">("idle");
  const deleting = state === "deleting";
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        setOpen(next);
        if (!next) setState("idle");
      }}
    >
      <AlertDialogTrigger asChild>
        <Item asChild className={`${ROW} text-destructive`}>
          <button type="button">
            {t("delete")}
          </button>
        </Item>
      </AlertDialogTrigger>
      <AlertDialogContent
        onEscapeKeyDown={(e) => deleting && e.preventDefault()}
        className="flex flex-col gap-3.5 rounded-2xl bg-surface-2 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] data-[size=default]:max-w-[calc(100%-40px)] data-[size=default]:sm:max-w-[440px] md:p-7"
      >
        <span className="text-destructive">
          <AlertIcon size={26} />
        </span>
        <AlertDialogTitle className="font-display text-[28px] leading-[1.2] font-normal">{t("title")}</AlertDialogTitle>
        <AlertDialogDescription className="text-[15px] leading-[1.55] font-light text-pretty text-foreground">{t("confirm")}</AlertDialogDescription>
        {state === "error" && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertIcon size={16} />
            {t("error")} {t("errorKept")}
          </p>
        )}
        <div className="flex gap-2.5 pt-2 md:justify-end">
          <AlertDialogCancel
            disabled={deleting}
            className="h-12 flex-1 rounded-lg border-foreground/55 bg-transparent px-3 text-[15px] font-normal hover:bg-transparent disabled:opacity-40 md:flex-none md:px-6 dark:border-foreground/55 dark:bg-transparent"
          >
            {t("cancel")}
          </AlertDialogCancel>
          {/* Button, not AlertDialogAction: Action closes the dialog, and its Slot drops bg-destructive. */}
          <Button
            disabled={deleting}
            className="h-12 flex-1 gap-2.5 rounded-lg bg-destructive px-3 text-[15px] text-primary-foreground hover:bg-destructive/90 disabled:opacity-80 md:flex-none md:px-6"
            onClick={async () => {
              setState("deleting");
              try {
                await onDelete();
              } catch {
                setState("error");
              }
            }}
          >
            {deleting && <Spinner aria-hidden role="presentation" />}
            {deleting ? t("deleting") : t("delete")}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Settings({ account, api }: { account: Account; api: SettingsApi }) {
  const t = useTranslations("Settings");
  const ts = useTranslations("Shell");
  const tf = useTranslations("Feedback");
  const router = useRouter();
  const pathname = usePathname(); // /app/settings, or the dev fixture's /dev/settings
  const leave = () => {
    router.push("/");
    router.refresh();
  };
  return (
    <div className="relative flex flex-1 flex-col motion-safe:animate-in fade-in">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[240px] bg-night md:h-[300px]" />
      <main className="relative flex flex-col gap-2.5 px-[18px] pt-16 pb-24 md:gap-6 md:px-16 md:pb-14">
        <h1 className="px-1 pb-3.5 font-display text-[54px] leading-[60px] font-light md:px-0 md:pb-0">{t("title")}</h1>

        <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:items-start md:gap-4">
          <div className="flex flex-col gap-2.5">
            <Item aria-label={t("account")} className={`gap-3.5 px-[18px] py-3.5 md:gap-4 md:px-[22px] md:py-[18px] ${CARD}`}>
              {account.picture ? (
                // eslint-disable-next-line @next/next/no-img-element -- Google avatar host is not in next.config images
                <img src={account.picture} alt="" width={44} height={44} className="size-11 shrink-0 rounded-4xl object-cover" />
              ) : (
                <span aria-hidden className="size-11 shrink-0 rounded-4xl bg-photo" />
              )}
              <ItemContent className="gap-0.5">
                {account.name && <ItemTitle className="text-[15.5px] font-medium">{account.name}</ItemTitle>}
                <ItemDescription className="text-[13px] font-light">{account.email}</ItemDescription>
              </ItemContent>
            </Item>

            <Group label={t("display")} className="py-1.5 pr-1.5 pl-[18px] md:py-2 md:pr-2 md:pl-[22px]">
              <LanguageRow />
            </Group>

            <Group label={t("data")} className="pr-3 pl-[18px] md:pr-3.5 md:pl-[22px]">
              <Item asChild className={ROW}>
                <Link href="/app/history">
                  {t("history")}
                  <span className={HIT}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </Item>
            </Group>
          </div>

          <div className="flex flex-col gap-2.5">
            <Group label={t("support")} className="pr-3 pl-[18px] md:pr-3.5 md:pl-[22px]">
              <Item asChild className={ROW}>
                <Link href={`${pathname}/feedback`}>
                  {tf("title")}
                  <span className={HIT}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </Item>
              <Item asChild className={ROW}>
                <Link href="/privacy" target="_blank">
                  {t("privacy")}
                  <span className={HIT}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                    </svg>
                  </span>
                </Link>
              </Item>
            </Group>

            <div className="mt-2.5 md:mt-[22px]">
              <Group>
                <Item asChild className={ROW}>
                  <button type="button" onClick={() => api.signOut().then(leave)}>
                    {ts("signOut")}
                  </button>
                </Item>
                <DeleteAccountRow onDelete={() => api.deleteAccount().then(leave)} />
              </Group>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
