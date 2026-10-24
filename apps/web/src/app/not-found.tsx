import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

// Layout: canvas WebNotFound (night gradient, centred 404, one filled button).
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute inset-x-0 top-0 h-[620px] bg-night" aria-hidden />
      <SiteHeader />
      <main className="relative my-auto flex flex-col items-center gap-5 px-6 pb-24 text-center">
        <span className="font-display text-[120px] leading-none font-light md:text-[160px]">404</span>
        <h1 className="font-display text-[34px] leading-[1.2] font-light md:text-[44px]">{t("title")}</h1>
        <p className="text-[17px] font-light text-muted-foreground">{t("body")}</p>
        <Link href="/" className="mt-3 flex h-[52px] items-center rounded-lg bg-primary px-6 text-[15px] font-medium text-primary-foreground">
          {t("home")}
        </Link>
      </main>
    </div>
  );
}
