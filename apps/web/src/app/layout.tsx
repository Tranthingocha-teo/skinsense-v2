import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
// Self-hosted (npm) instead of next/font/google: the Google Fonts fetch at build time
// failed intermittently in CI ("next/font/google queries have exactly one entry").
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-serif-display";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fontVars = {
  "--font-display": '"Noto Serif Display Variable"',
  "--font-body": '"Manrope Variable"',
} as React.CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Landing");
  return {
    metadataBase: new URL("https://skinsense-v2-topaz.vercel.app"),
    title: t("title"),
    description: t("tagline"),
    manifest: "/manifest.json",
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
    openGraph: { title: t("title"), description: t("tagline"), siteName: "SkinSense", type: "website" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={await getLocale()}
      className="h-full antialiased"
      style={fontVars}
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
