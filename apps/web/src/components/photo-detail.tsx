"use client";

import { NOTE_MAX, noteError, reddestReading, TAG_MAX, tagError } from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { useAppHref } from "@/components/app-nav";
import { LoadState } from "@/components/load-state";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { addTag, deletePhoto, loadPhotoDetail, PhotoDetailData, removeTag, saveNote } from "@/lib/history";

// The route binds these: Supabase-backed when signed in, generated sample data in the demo.
export type PhotoDetailApi = {
  loadPhotoDetail: typeof loadPhotoDetail;
  deletePhoto: typeof deletePhoto;
  saveNote: typeof saveNote;
  addTag: typeof addTag;
  removeTag: typeof removeTag;
};

// Canvas WebPhoto (1440) / PhonePhoto (390): readings, Note card, Tags, actions.
// Ticket 17 adds Chia sẻ (web: beside Đánh dấu nốt mụn, phone: header icon).
const CARD = "rounded-2xl border border-foreground/10 bg-card";
const LABEL = "text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground";
const NUMBER = "font-display text-[44px] leading-[1.15] font-light";

// Canvas AndroidPhotoDelete / WebPhotoDelete, with the deleting and error states of DeleteAccountRow
// (settings.tsx): the dialog stays open while deleting and on failure.
function DeletePhoto({ night, onDelete }: { night: string; onDelete: () => Promise<void> }) {
  const t = useTranslations("History");
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
        <button type="button" className="flex min-h-11 shrink-0 items-center px-2 text-[15px] text-destructive md:ml-auto md:px-0">
          {t("delete")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onEscapeKeyDown={(e) => deleting && e.preventDefault()}
        className="flex flex-col gap-3.5 rounded-2xl bg-surface-2 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] data-[size=default]:max-w-[calc(100%-40px)] data-[size=default]:sm:max-w-[440px]"
      >
        <AlertDialogTitle className="font-display text-[28px] leading-[1.2] font-normal">{t("deleteTitle")}</AlertDialogTitle>
        <AlertDialogDescription className="text-[15px] leading-[1.55] font-light text-pretty text-foreground">{t("deleteBody", { date: night })}</AlertDialogDescription>
        {state === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {t("deleteError")}
          </p>
        )}
        <div className="flex gap-2.5 pt-2">
          <AlertDialogCancel
            disabled={deleting}
            className="h-12 flex-1 rounded-lg border-foreground/55 bg-transparent px-3 text-[15px] font-normal hover:bg-transparent disabled:opacity-40 dark:border-foreground/55 dark:bg-transparent"
          >
            {t("cancel")}
          </AlertDialogCancel>
          {/* Button, not AlertDialogAction: Action closes the dialog, and its Slot drops bg-destructive. */}
          <Button
            disabled={deleting}
            className="h-12 flex-1 gap-2.5 rounded-lg bg-destructive px-3 text-[15px] text-primary-foreground hover:bg-destructive/90 disabled:opacity-80"
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

// Saved when the Textarea loses focus, only if valid and changed.
function NoteCard({ photo, api }: { photo: PhotoDetailData; api: PhotoDetailApi }) {
  const t = useTranslations("History");
  const [note, setNote] = useState(photo.note ?? "");
  const [saved, setSaved] = useState(photo.note ?? "");
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const tooLong = noteError(note) === "tooLong";

  async function save() {
    if (tooLong || note.trim() === saved.trim()) return;
    try {
      await api.saveNote(photo.id, note);
      setSaved(note);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <Field data-invalid={tooLong} className={`mt-3.5 gap-2.5 px-[18px] py-4 focus-within:border-foreground/30 md:mt-0 md:px-5 md:py-[18px] ${CARD}`}>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="photo-note" className={LABEL}>
          {t("note")}
        </FieldLabel>
        {state === "saved" && (
          <span role="status" className="text-xs font-light text-muted-foreground">
            {t("noteSaved")}
          </span>
        )}
      </div>
      <Textarea
        id="photo-note"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setState("idle");
        }}
        onBlur={() => void save()}
        placeholder={t("notePlaceholder")}
        aria-invalid={tooLong}
        className="min-h-[52px] resize-none rounded-none border-0 bg-transparent p-0 text-[15px] leading-[1.55] font-light text-foreground focus-visible:ring-0 aria-invalid:ring-0 md:min-h-[72px] md:text-[15px] dark:bg-transparent"
      />
      {tooLong && <FieldError>{t("noteTooLong", { max: NOTE_MAX })}</FieldError>}
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("noteError")}
        </p>
      )}
    </Field>
  );
}

const CHIP = "h-11 rounded-lg border-foreground/14 text-sm font-normal";

// Canvas .chip Badges with a 44px remove target; "Thêm tag" turns into an input (Enter adds, Escape cancels).
function Tags({ photo, api }: { photo: PhotoDetailData; api: PhotoDetailApi }) {
  const t = useTranslations("History");
  const [tags, setTags] = useState(photo.tags);
  const [draft, setDraft] = useState<string | null>(null); // null: not adding
  const [error, setError] = useState<"empty" | "tooLong" | "duplicate" | "failed" | null>(null);
  const messages = { empty: t("tagEmpty"), tooLong: t("tagTooLong", { max: TAG_MAX }), duplicate: t("tagDuplicate"), failed: t("tagError") };

  async function add(label: string) {
    const invalid = tagError(label, tags.map((tag) => tag.label));
    if (invalid) return setError(invalid);
    try {
      const tag = await api.addTag(photo.id, label);
      setTags((current) => [...current, tag]);
      setDraft(null);
      setError(null);
    } catch {
      setError("failed");
    }
  }

  async function remove(id: string) {
    try {
      await api.removeTag(id);
      setTags((current) => current.filter((tag) => tag.id !== id));
      setError(null);
    } catch {
      setError("failed");
    }
  }

  return (
    <div role="group" aria-labelledby="photo-tags" className="mt-4 flex flex-col gap-2.5 md:mt-0">
      <span id="photo-tags" className={LABEL}>
        {t("tags")}
      </span>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag.id} variant="outline" className={`${CHIP} pr-0 pl-3.5`}>
            {tag.label}
            <button type="button" aria-label={t("removeTag", { label: tag.label })} onClick={() => void remove(tag.id)} className="grid size-11 place-items-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </Badge>
        ))}
        {draft === null ? (
          <button type="button" onClick={() => setDraft("")} className={`flex items-center gap-1.5 border border-dashed px-4 text-muted-foreground ${CHIP}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("addTag")}
          </button>
        ) : (
          <Input
            autoFocus
            aria-label={t("newTag")}
            aria-invalid={error !== null && error !== "failed"}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add(draft);
              if (e.key === "Escape") {
                setDraft(null);
                setError(null);
              }
            }}
            onBlur={() => !draft.trim() && (setDraft(null), setError(null))}
            placeholder={t("newTag")}
            className={`w-44 px-3.5 md:text-sm ${CHIP}`}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {messages[error]}
        </p>
      )}
    </div>
  );
}

export function PhotoDetail({ photoId, api }: { photoId: string; api: PhotoDetailApi }) {
  const t = useTranslations("History");
  const tt = useTranslations("Today");
  const tz = useTranslations("Capture.zones");
  const format = useFormatter();
  const appHref = useAppHref();
  const router = useRouter();
  const [photo, setPhoto] = useState<PhotoDetailData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    api.loadPhotoDetail(photoId).then(
      (loaded) => !cancelled && setPhoto(loaded),
      () => !cancelled && setPhoto(null),
    );
    return () => {
      cancelled = true;
    };
  }, [api, photoId, attempt]);

  const taken = photo ? new Date(photo.taken_at) : undefined;
  const night = taken && format.dateTime(taken, { day: "numeric", month: "short" });
  // Date and time formatted apart, so Vietnamese keeps the canvas order "13 thg 9, 22:14".
  const title = taken && `${night}, ${format.dateTime(taken, { hour: "2-digit", minute: "2-digit" })}`;
  // The reddest zone: the one reading worth a glance on a single night.
  const reading = photo && reddestReading(photo.readings);

  return (
    <main className="flex flex-1 flex-col px-5 pt-4 pb-7 motion-safe:animate-in fade-in md:gap-6 md:px-16 md:py-14">
      <header className="-ml-2.5 flex items-center gap-1 md:-ml-3">
        <Link href={appHref("/history")} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="font-display text-[30px] leading-[1.15] font-light md:text-[44px] md:leading-[1.2]">{title}</h1>
      </header>

      {photo === undefined && <LoadState failed={false} onRetry={retry} />}
      {photo === null && (
        <LoadState
          failed
          onRetry={() => {
            setPhoto(undefined);
            retry();
          }}
        />
      )}
      {photo && (
        <div className="flex flex-1 flex-col md:flex-none md:flex-row md:items-start md:gap-14">
          <div className="relative mt-3 h-[320px] shrink-0 overflow-hidden rounded-2xl bg-photo md:mt-0 md:h-[640px] md:w-[480px]">
            {photo.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- mirrored like every stored photo on screen (ticket 07)
              <img src={photo.url} alt="" className="absolute inset-0 size-full -scale-x-100 object-cover" />
            ) : (
              <span className="absolute bottom-3.5 left-3.5 rounded-4xl border border-dashed border-foreground/45 px-2.5 py-1 text-[11px] md:bottom-4 md:left-4">
                {tt("photoPlaceholder")}
              </span>
            )}
            <span aria-hidden className="absolute top-3 right-3 rounded-4xl bg-background/60 px-2.5 py-1 text-xs font-medium md:hidden">
              {t("spots", { count: photo.spotCount })}
            </span>
          </div>

          <div className="flex flex-1 flex-col md:w-[440px] md:flex-none md:gap-5">
            <div className="mt-3.5 grid gap-4 md:mt-0 md:grid-cols-2">
              <div className={`flex flex-col px-[18px] py-4 max-md:sr-only md:px-5 ${CARD}`}>
                <span className={LABEL}>{t("spotsMarked")}</span>
                <span className={NUMBER}>{photo.spotCount}</span>
              </div>
              {reading && (
                <div className={`flex flex-col px-[18px] py-4 md:px-5 ${CARD}`}>
                  <span className={LABEL}>{t("redness", { zone: tz(reading.zone) })}</span>
                  <span className={NUMBER}>{reading.redness.toFixed(1)}</span>
                </div>
              )}
            </div>

            <NoteCard photo={photo} api={api} />
            <Tags photo={photo} api={api} />

            <div className="mt-auto flex items-center justify-between gap-3 pt-5 md:mt-0 md:justify-start md:pt-3">
              <Link
                href={appHref(`/spots/${photo.id}`)}
                className="flex h-[52px] flex-1 items-center justify-center rounded-lg border border-foreground/55 px-6 text-[15px] md:h-12 md:flex-none"
              >
                {t("markSpots")}
              </Link>
              <DeletePhoto night={night!} onDelete={() => api.deletePhoto(photo).then(() => router.replace(appHref("/history")))} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
