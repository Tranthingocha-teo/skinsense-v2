import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("locale")?.value;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const locale: Locale =
    cookieLocale === "en" || cookieLocale === "vi"
      ? cookieLocale
      : acceptLanguage.toLowerCase().startsWith("vi") ? "vi" : "en";
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
