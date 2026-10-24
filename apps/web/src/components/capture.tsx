"use client";

import { ZONES, type CaptureIssue, type Landmark } from "@skinsense/domain";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as engineLib from "@/lib/capture-engine.web";
import type { Engine, Still } from "@/lib/capture-engine.web";
import * as photosLib from "@/lib/photos";
import { APK_URL } from "@/lib/utils";

// The route uses the real modules; the dev page (screenshots) swaps the ones that touch Supabase.
export type CaptureApi = Pick<typeof engineLib, "startCamera" | "loadEngine" | "sampleFrame" | "captureStill"> &
  Pick<typeof photosLib, "latestPhotoUrl" | "savePhoto">;
const realApi: CaptureApi = { ...engineLib, ...photosLib };

// Canvas WebCapture: guide ellipse 124/720 x 176/540 of the 4:3 viewfinder, centred at 262/540.
const GUIDE = { cy: 0.485, rx: 0.172, ry: 0.326 };
const SAMPLE_INTERVAL_MS = 100; // ~10 fps landmark tracking; phones are 2-4x slower than the bench laptop
const PHONE = "(max-width: 767px)"; // below Tailwind md: the phone-browser screen, no camera

type Phase = "loading" | "cameraError" | "live" | "analysing" | "review" | "saving" | "saved";

const CARD = "rounded-2xl border border-foreground/10 bg-card";
const BTN = "flex h-12 items-center justify-center gap-2.5 rounded-lg px-6 text-[15px]";
const BTN_O = `${BTN} border border-foreground/55`;
const BTN_FILL = `${BTN} bg-primary font-medium text-primary-foreground disabled:opacity-60`;
const VALUE = "text-right font-display text-[22px] font-light";

// Canvas icons (design-2/build.mjs ICONS), stroke 1.5.
const ICONS = {
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.4v.2" /></>,
  cameraOff: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7l1.6-2.5h4.8L16 7" /><path d="M3 3l18 18" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  check: <path d="M5 13l4 4L19 7" />,
  download: <><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
};
function Glyph({ name, size }: { name: keyof typeof ICONS; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {ICONS[name]}
    </svg>
  );
}

function sameIssues(a: CaptureIssue[], b: CaptureIssue[]) {
  return a.length === b.length && a.every((issue, i) => issue === b[i]);
}

function drawOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, landmarks: Landmark[] | null) {
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  const { width, height } = canvas;
  const unit = width / 720; // canvas values are in 720px-wide artboard pixels
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = ctx.fillStyle = getComputedStyle(canvas).color; // foreground token
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.5 * unit;
  ctx.lineCap = "round";
  ctx.setLineDash([3.5 * unit, 7 * unit]);
  ctx.beginPath();
  ctx.ellipse(width / 2, GUIDE.cy * height, GUIDE.rx * width, GUIDE.ry * height, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (!landmarks) return;
  ctx.globalAlpha = 0.55;
  const r = width / 230;
  ctx.beginPath();
  for (const p of landmarks) {
    ctx.moveTo(p.x * width + r, p.y * height);
    ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

export function Capture({ api = realApi }: { api?: CaptureApi }) {
  const t = useTranslations("Capture");
  const tc = useTranslations("Common");
  const format = useFormatter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine>(null);
  const streamRef = useRef<MediaStream>(null);
  const liveRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, retryCamera] = useReducer((n: number) => n + 1, 0);
  const [liveIssues, setLiveIssues] = useState<CaptureIssue[]>(["noFace"]);
  const [ghostUrl, setGhostUrl] = useState<string | null>(null);
  const [still, setStill] = useState<Still | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState<{ id: string; at: Date } | null>(null);

  useEffect(() => {
    liveRef.current = phase === "live";
  }, [phase]);

  useEffect(() => {
    if (window.matchMedia(PHONE).matches) return;
    const video = videoRef.current!;
    let frame = 0;
    let lastSample = 0;
    let cancelled = false;
    api.latestPhotoUrl().then(setGhostUrl).catch(() => {});
    Promise.all([api.startCamera(video), api.loadEngine()])
      .then(([stream, engine]) => {
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        engineRef.current = engine;
        setPhase("live");
        const loop = (now: number) => {
          frame = requestAnimationFrame(loop);
          if (!liveRef.current || now - lastSample < SAMPLE_INTERVAL_MS || video.readyState < 2) return;
          lastSample = now;
          const sample = api.sampleFrame(engine, video, now);
          drawOverlay(overlayRef.current!, video, sample.landmarks);
          setLiveIssues((prev) => (sameIssues(prev, sample.issues) ? prev : sample.issues));
        };
        frame = requestAnimationFrame(loop);
      })
      .catch(() => !cancelled && setPhase("cameraError")); // a cancelled start's play() is aborted by the next one
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [api, attempt]);

  async function shutter() {
    if (!engineRef.current || !streamRef.current) return;
    setPhase("analysing");
    try {
      setStill(await api.captureStill(engineRef.current, videoRef.current!, streamRef.current));
      setPhase("review");
    } catch {
      setPhase("live");
    }
  }

  function retake() {
    if (still) URL.revokeObjectURL(still.previewUrl);
    setStill(null);
    setSaveFailed(false);
    setPhase("live");
  }

  async function save() {
    if (!still?.readings) return;
    setPhase("saving");
    setSaveFailed(false);
    try {
      const id = await api.savePhoto({ image: still.image, brightness: still.brightness, awbLocked: still.awbLocked, readings: still.readings });
      setSaved({ id, at: new Date() });
      setPhase("saved");
      api.latestPhotoUrl().then(setGhostUrl).catch(() => {});
    } catch {
      setSaveFailed(true);
      setPhase("review");
    }
  }

  const showingStill = still !== null && phase !== "live";
  const badge = liveIssues[0];
  const shutterLabel = phase === "loading" ? t("loading") : phase === "analysing" ? t("analysing") : t("shutter");

  // Canvas WebCapture: 720x540 (4:3) live webcam, the still keeps the frame; WebCaptureSaved shrinks it to 560.
  const viewfinder = (
    <div className={`relative aspect-[4/3] min-w-0 flex-1 overflow-hidden rounded-2xl bg-surface-2 ${phase === "saved" ? "max-w-[560px]" : "max-w-[720px]"}`}>
      {/* Mirrored like a selfie preview. The stored JPEG is the raw camera frame
          (readings and any later landmark pass agree on it); every screen that
          shows a stored photo mirrors it the same way, in CSS only. */}
      <div className="absolute inset-0 -scale-x-100">
        <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" hidden={showingStill} />
        {ghostUrl && !showingStill && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ghostUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
        )}
        <canvas ref={overlayRef} className="absolute inset-0 size-full object-cover text-foreground" hidden={showingStill} />
        {showingStill && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still.previewUrl} alt="" className="size-full object-cover" />
        )}
      </div>
      {phase === "live" && (
        <>
          <div
            role="status"
            className="absolute top-[18px] left-[18px] flex items-center gap-2 rounded-4xl border border-foreground/14 bg-background/60 px-3 py-1.5 text-[12.5px] font-medium backdrop-blur-[12px]"
          >
            {badge ? <Glyph name="alert" size={15} /> : <span className="size-1.5 rounded-4xl bg-success" />}
            {badge ? t(`issues.${badge}`) : t("goodLight")}
          </div>
          {/* DESIGN.md: text over the photo sits on a scrim fading to bg. */}
          <p className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--background)_70%,transparent))] pt-10 pb-5 text-center text-[13px]">
            {t("placeFace")}
          </p>
        </>
      )}
    </div>
  );

  let aside: ReactNode;
  if (phase === "saved" && still?.readings && saved) {
    aside = (
      <div className="flex w-[440px] shrink-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-[13px] font-medium text-success">
            <Glyph name="check" size={16} />
            {t("savedTitle")}
          </span>
          <h2 className="font-display text-[28px] leading-[1.2] font-normal">
            {format.dateTime(saved.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </h2>
        </div>
        <div className={`px-[22px] pt-1.5 pb-2 ${CARD}`}>
          <table className="w-full">
            <thead>
              <tr className="h-10 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                <th className="text-left font-medium">{t("zone")}</th>
                <th className="w-[136px] text-right font-medium">{t("redness")}</th>
                <th className="w-[120px] text-right font-medium">{t("unevenness")}</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((zone) => {
                const reading = still.readings![zone];
                const empty = reading.pixelCount === 0;
                return (
                  <tr key={zone} className="h-11 border-t border-border text-[15px] font-light">
                    <td>{t(`zones.${zone}`)}</td>
                    <td className={VALUE}>{empty ? "—" : reading.redness.toFixed(1)}</td>
                    <td className={VALUE}>{empty ? "—" : reading.unevenness.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[12.5px] leading-[1.5] font-light text-pretty text-muted-foreground">{t("disclaimer")}</p>
        <div className="flex gap-3">
          <button type="button" onClick={retake} className={`flex-1 ${BTN_O}`}>
            {t("again")}
          </button>
          <Link href={`/app/spots/${saved.id}`} className={`flex-1 ${BTN_FILL}`}>
            {t("markSpots")}
          </Link>
        </div>
        <Link href="/app" className="flex min-h-11 items-center justify-center text-sm">
          {t("done")}
        </Link>
      </div>
    );
  } else if (still && (phase === "review" || phase === "saving")) {
    aside = (
      <div className="flex w-[320px] shrink-0 flex-col gap-5">
        {still.issues.length > 0 && (
          <Alert className={`gap-2.5 px-5 py-[18px] text-[14.5px] ${CARD}`}>
            <AlertTitle className="flex items-center gap-2.5 font-medium">
              <Glyph name="alert" size={18} />
              {t("qualityWarning")}
            </AlertTitle>
            <AlertDescription className="text-[14.5px] font-light text-foreground">
              <ul className="flex flex-col gap-2.5">
                {still.issues.map((issue) => (
                  <li key={issue} className="flex items-center gap-2.5 pl-7">
                    <span className="size-1 shrink-0 rounded-4xl bg-foreground" />
                    {t(`issues.${issue}`)}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {saveFailed && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <Glyph name="alert" size={16} />
            {t("saveError")}
          </p>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={retake} disabled={phase === "saving"} className={`flex-1 ${BTN_O}`}>
            {t("retake")}
          </button>
          {still.readings && (
            <button type="button" onClick={save} disabled={phase === "saving"} className={`flex-1 ${BTN_FILL}`}>
              {phase === "saving" ? t("saving") : still.issues.length > 0 ? t("saveAnyway") : t("save")}
            </button>
          )}
        </div>
      </div>
    );
  } else {
    aside = (
      <div className="flex w-[300px] shrink-0 flex-col gap-9">
        <p className="text-[15px] leading-[1.6] font-light text-pretty text-muted-foreground">{t("keepDistance")}</p>
        <div className={`flex items-center gap-4 ${phase === "live" ? "" : "opacity-40"}`}>
          <button
            type="button"
            onClick={shutter}
            disabled={phase !== "live"}
            aria-label={shutterLabel}
            className="grid size-[68px] place-items-center rounded-4xl border-[1.5px] border-foreground/55"
          >
            <span className="size-[54px] rounded-4xl bg-primary" />
          </button>
          <span className="text-sm" aria-hidden>
            {shutterLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Canvas WebCapture: desktop only; the canvas has no back arrow beside the sidebar. */}
      <div className="hidden flex-1 flex-col gap-8 px-16 pt-16 pb-14 md:flex motion-safe:animate-in fade-in">
        <h1 className="font-display text-[54px] leading-[60px] font-light">{t("title")}</h1>
        <div className={`flex gap-14 ${phase === "saved" ? "items-start" : "items-center"}`}>
          {phase === "cameraError" ? (
            // Canvas WebCameraDenied: the card takes the viewfinder's place.
            <div role="alert" className={`flex aspect-[4/3] min-w-0 max-w-[720px] flex-1 flex-col items-center justify-center gap-5 px-[120px] text-center ${CARD}`}>
              <span className="grid size-[72px] place-items-center rounded-4xl border border-foreground/30">
                <Glyph name="cameraOff" size={30} />
              </span>
              <p className="text-[17px] leading-[1.55] font-light text-pretty">{t("cameraError")}</p>
              <button type="button" onClick={() => { setPhase("loading"); retryCamera(); }} className={BTN_O}>
                <Glyph name="refresh" size={18} />
                {tc("retry")}
              </button>
            </div>
          ) : (
            viewfinder
          )}
          {aside}
        </div>
      </div>

      {/* Canvas PhoneCapture: phone browsers cannot capture; point to the Android app. */}
      <div className="flex flex-1 flex-col px-[18px] pt-4 pb-8 md:hidden">
        <header className="-ml-2 flex items-center gap-1">
          <Link href="/app" aria-label={t("back")} className="grid size-11 shrink-0 place-items-center">
            <Glyph name="back" size={23} />
          </Link>
          <h1 className="font-display text-[34px] leading-[1.15] font-light">{t("title")}</h1>
        </header>
        <div role="note" className={`mt-4 flex flex-col gap-4 px-5 py-[22px] ${CARD}`}>
          <span className="grid size-11 place-items-center rounded-4xl border border-foreground/30">
            <Glyph name="cameraOff" size={22} />
          </span>
          <p className="text-base leading-[1.55] font-light text-pretty">{t("apkBanner")}</p>
          <a href={APK_URL} className="flex h-[52px] items-center justify-center gap-2.5 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground">
            <Glyph name="download" size={18} />
            {t("apkLink")}
          </a>
        </div>
        <p className="mt-4 px-2.5 text-[13.5px] leading-[1.55] font-light text-muted-foreground">{t("desktopHint")}</p>
      </div>
    </>
  );
}
