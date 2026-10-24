import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Manrope, Noto_Serif_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// DESIGN.md: preload only the display weights (the landing h1 is the LCP text).
const display = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Landing");
  return {
    metadataBase: new URL("https://skinsense-v2.vercel.app"),
    title: t("title"),
    description: t("tagline"),
    openGraph: { title: t("title"), description: t("tagline"), siteName: "SkinSense", type: "website" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={await getLocale()}
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
          {/* Root, not AppShell: a toast fired before router.push survives the page change. Phone width clears the 72px tab bar. */}
          <Toaster offset={32} mobileOffset={{ bottom: 88 }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
