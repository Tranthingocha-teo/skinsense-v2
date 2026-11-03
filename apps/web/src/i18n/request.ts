import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("locale")?.value;
  const locale: Locale = cookieLocale === "en" ? "en" : "vi";
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
