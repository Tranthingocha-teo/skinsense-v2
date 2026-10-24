"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { resetDemo } from "@/lib/demo";

export function DemoBanner() {
  const t = useTranslations("Demo");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-primary-soft px-5 py-2 text-sm md:px-10">
      <span className="font-semibold">{t("title")}</span>
      <span className="text-muted-foreground">{t("note")}</span>
      <span className="rounded-lg bg-card px-3 py-1.5 text-[13px] font-semibold">{t("persona")}</span>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => {
            resetDemo();
            location.reload();
          }}
          className="min-h-11 rounded-[10px] px-3.5 text-[13.5px] font-semibold text-muted-foreground hover:bg-card"
        >
          {t("reset")}
        </button>
        <Link href="/#cta" className="flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground">
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
