import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CanvasIcon, SiteHeader } from "@/components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: `${t("title")} · SkinSense`, description: t("intro") };
}

// Public (proxy.ts only gates /app); linked from the landing footer and the mobile sign-in screen.
// Layout: canvas WebPrivacy (night gradient behind a 720px column).
export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");
  const sections = t.raw("sections") as { title: string; body: string[] }[];
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-night" aria-hidden />
      <SiteHeader>
        <Link href="/" className="flex min-h-11 items-center gap-2 px-2 text-sm underline underline-offset-4 hover:text-muted-foreground md:px-0">
          <CanvasIcon name="back" size={18} />
          {t("back")}
        </Link>
      </SiteHeader>
      <main className="relative mx-auto flex w-full max-w-[720px] flex-col gap-8 px-6 pt-10 pb-16 md:gap-10 md:px-0 md:pt-16 md:pb-24">
        <div className="flex flex-col gap-3.5">
          <h1 className="font-display text-[40px] leading-[1.1] font-light md:text-[54px] md:leading-[60px]">{t("title")}</h1>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{t("updated")}</span>
          <p className="pt-2.5 text-[17px] font-light leading-[1.65] text-pretty md:text-lg">{t("intro")}</p>
        </div>
        {sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-3 border-t border-border pt-7">
            <h2 className="font-display text-[26px]">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="text-[15px] font-light leading-[1.7] text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
