"use client";

import {
  assignSpotToZone,
  boundingBox,
  fromFaceRelative,
  toFaceRelative,
  ZONES,
  type Landmark,
  type Point2D,
  type Zone,
} from "@skinsense/domain";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useAppHref } from "@/components/app-nav";
import { detectImage, loadEngine } from "@/lib/capture-engine.web";
import type { loadPhoto, loadSpots, saveSpots } from "@/lib/photos";

// The route binds these: Supabase when signed in, the sample photo and browser storage in the demo.
export type MarkSpotsApi = { loadPhoto: typeof loadPhoto; loadSpots: typeof loadSpots; saveSpots: typeof saveSpots };

type Face = { width: number; height: number; landmarks: Landmark[] };
type Spot = Point2D & { zone: Zone }; // image-normalised while on screen; face-relative once stored
type Phase = "loading" | "ready" | "noFace" | "loadError" | "saving" | "saveError" | "saved";

const BUTTON =
  "grid h-[52px] w-full place-items-center rounded-lg bg-primary text-[15px] font-medium text-primary-foreground lg:mt-3 lg:h-12 lg:w-[200px]";

// Canvas alert icon (design-2/build.mjs ICONS.alert).
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-destructive">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.4v.2" />
    </svg>
  );
}

export function MarkSpots({ photoId, api }: { photoId: string; api: MarkSpotsApi }) {
  const t = useTranslations("MarkSpots");
  const appHref = useAppHref();
  const tz = useTranslations("Capture.zones");
  const [url, setUrl] = useState<string | null>(null);
  const [face, setFace] = useState<Face | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [outside, setOutside] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    api.loadPhoto(photoId)
      .then((u) => (cancelled ? URL.revokeObjectURL(u) : setUrl((objectUrl = u))))
      .catch(() => setPhase("loadError"));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, photoId]);

  async function analyse(img: HTMLImageElement) {
    try {
      const [engine, stored] = await Promise.all([loadEngine(), api.loadSpots(photoId)]);
      const { width, height, landmarks } = detectImage(engine, img);
      if (!landmarks) return setPhase("noFace");
      const box = boundingBox(landmarks);
      setFace({ width, height, landmarks });
      setSpots(stored.map((s) => ({ ...fromFaceRelative(s, box), zone: s.zone })));
      setPhase("ready");
    } catch {
      setPhase("loadError");
    }
  }

  function tap(e: MouseEvent<HTMLDivElement>) {
    if (!face || phase === "saving") return;
    // object-cover ≡ xMidYMid slice: same scale and centring as the mirrored <img>.
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.max(rect.width / face.width, rect.height / face.height);
    const px = (e.clientX - rect.left - (rect.width - face.width * scale) / 2) / scale;
    const py = (e.clientY - rect.top - (rect.height - face.height * scale) / 2) / scale;
    const point = { x: 1 - px / face.width, y: py / face.height }; // un-mirror
    const zone = assignSpotToZone(point, face.landmarks);
    setOutside(!zone);
    if (!zone) return;
    setSpots([...spots, { ...point, zone }]);
    setPhase("ready");
  }

  function remove(index: number) {
    setSpots(spots.filter((_, i) => i !== index));
    setOutside(false);
    setPhase("ready");
  }

  async function save() {
    if (!face) return;
    setPhase("saving");
    const box = boundingBox(face.landmarks);
    try {
      await api.saveSpots(photoId, spots.map((s) => ({ ...toFaceRelative(s, box), zone: s.zone })));
      setPhase("saved");
    } catch {
      setPhase("saveError");
    }
  }

  const perZone = ZONES.map((zone) => [zone, spots.filter((s) => s.zone === zone).length] as const).filter(([, n]) => n > 0);
  // One image pixel on screen under object-cover, in container query units, so markers keep 44px and stay on their spot at any box size.
  const imagePx = face && `max(100cqw / ${face.width}, 100cqh / ${face.height})`;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 pt-4 pb-8 lg:mx-0 lg:max-w-none lg:gap-6 lg:px-16 lg:py-14">
      <header className="-ml-2.5 flex items-center gap-1 lg:-ml-3">
        <Link href={appHref("")} aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="font-display text-[34px] leading-[1.15] font-light lg:text-[44px] lg:leading-[1.2]">{t("title")}</h1>
      </header>

      <div className="flex flex-1 flex-col lg:flex-none lg:flex-row lg:items-start lg:gap-14">
        <div className="relative mt-3 aspect-[3/4] shrink-0 overflow-hidden rounded-2xl bg-photo [container-type:size] lg:mt-0 lg:h-[640px] lg:w-[480px]">
          {url && (
            // Mirrored in CSS like the viewfinder (ticket 07's mirror rule); the file itself stays raw.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" onLoad={(e) => analyse(e.currentTarget)} className="absolute inset-0 size-full -scale-x-100 object-cover" />
          )}
          {face && <div role="img" aria-label={t("tapHint")} onClick={tap} className="absolute inset-0 touch-manipulation" />}
          {face &&
            spots.map((s, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("remove")}
                onClick={() => remove(i)}
                className="absolute grid size-11 -translate-1/2 place-items-center"
                style={{
                  left: `calc(50cqw + ${(0.5 - s.x) * face.width} * ${imagePx})`, // mirrored like the photo
                  top: `calc(50cqh + ${(s.y - 0.5) * face.height} * ${imagePx})`,
                }}
              >
                <span className="absolute size-[30px] rounded-4xl bg-primary/24 lg:size-[42px]" />
                <span className="relative size-[13px] rounded-4xl border-[1.5px] border-background bg-primary lg:size-[18px] lg:border-2" />
              </button>
            ))}
          {phase === "loading" && <p className="absolute inset-0 grid place-items-center p-10 text-center text-[15px] font-light">{t("loading")}</p>}
          {(phase === "noFace" || phase === "loadError") && (
            <p role="alert" className="absolute inset-0 grid place-items-center bg-background/55 p-10 text-center text-[15px] leading-[1.55] font-light">
              {t(phase)}
            </p>
          )}
        </div>

        {face && (
          <div className="flex flex-1 flex-col lg:w-[340px] lg:flex-none lg:gap-5 lg:pt-2">
            <p role="status" className="flex items-center justify-center gap-2 pt-[18px] text-center text-sm font-light text-muted-foreground lg:justify-start lg:gap-2.5 lg:pt-0 lg:text-left lg:text-[15px]">
              {outside ? <AlertIcon /> : <span className="size-2 shrink-0 rounded-4xl bg-primary" aria-hidden />}
              {outside ? t("outside") : t("count", { count: spots.length })}
            </p>
            {perZone.length > 0 && (
              <ul className="flex flex-wrap justify-center gap-2 pt-3 lg:justify-start lg:pt-0">
                {perZone.map(([zone, n]) => (
                  <li key={zone} className="flex items-baseline gap-1.5 rounded-lg border border-foreground/14 px-3 py-[5px] text-[13px]">
                    {tz(zone)} <span className="font-display text-[17px]">{n}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex flex-col pt-5 lg:mt-0 lg:gap-5 lg:pt-0">
              {phase === "saveError" && (
                <p role="alert" className="flex items-center justify-center gap-2 pb-3 text-sm text-destructive lg:justify-start lg:pt-1 lg:pb-0">
                  <AlertIcon />
                  {t("saveError")}
                </p>
              )}
              {phase === "saved" ? (
                <>
                  <p className="pb-3 text-center text-sm font-medium text-success lg:pb-0 lg:text-left">{t("saved")}</p>
                  <Link href={appHref("")} className={BUTTON}>
                    {t("done")}
                  </Link>
                </>
              ) : (
                <button type="button" onClick={save} disabled={phase === "saving"} className={`${BUTTON} disabled:opacity-60`}>
                  {phase === "saving" ? t("saving") : t("save")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
