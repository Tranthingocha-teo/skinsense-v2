import { useTranslations } from "next-intl";

// What a data screen renders before its data arrives: loading, or a failed load with a retry.
export function LoadState({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  const t = useTranslations("Common");
  if (!failed) {
    return (
      <p role="status" className="py-16 text-center text-muted-foreground motion-safe:animate-pulse">
        {t("loading")}
      </p>
    );
  }
  // Canvas WebLoadError / AndroidLoadError: centred in the space the screen's data would fill.
  return (
    <div role="alert" className="mx-auto my-auto flex max-w-[420px] flex-col items-center gap-[18px] px-10 py-16 text-center md:gap-5 md:pb-[120px]">
      <span className="grid size-16 place-items-center rounded-4xl border border-foreground/30 md:size-[72px]">
        <svg className="size-7 md:size-[30px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z" />
          <path d="M4 4l16 16" />
        </svg>
      </span>
      <p className="text-[15.5px] leading-[1.55] font-light text-pretty md:text-[17px]">{t("loadError")}</p>
      <button type="button" onClick={onRetry} className="flex h-12 items-center gap-2.5 rounded-lg border border-foreground/55 px-6 text-[15px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
        {t("retry")}
      </button>
    </div>
  );
}
