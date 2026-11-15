"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

// Shown on the landing when /auth/callback sent the visitor back with ?auth_error=… (lib/auth-redirect.ts).
export function AuthErrorNotice() {
  const t = useTranslations("Landing");
  const reason = useSearchParams().get("auth_error");
  if (!reason) return null;
  return (
    <div role="alert" className="relative z-20 mx-4 mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm md:mx-14">
      <p className="font-semibold">{t("authErrorTitle")}</p>
      <p className="text-muted-foreground">{t("authErrorBody")}</p>
    </div>
  );
}
