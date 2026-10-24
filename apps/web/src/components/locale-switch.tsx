"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// Writes the cookie i18n/request.ts reads, then re-renders the server components in the new language.
export function LocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Locale");
  return (
    <div role="group" aria-label={t("label")} className="flex rounded-lg bg-border p-0.5 text-xs font-semibold">
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => {
            document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
            router.refresh();
          }}
          className="min-h-11 min-w-11 rounded-md px-2 uppercase text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground"
        >
          {l}
        </button>
      ))}
    </div>
  );
}
