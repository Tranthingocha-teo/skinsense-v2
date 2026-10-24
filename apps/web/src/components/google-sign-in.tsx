"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useRef, useState } from "react";
import { googleWebClientId } from "@/lib/env";
import { generateNonce } from "@/lib/nonce";
import { createClient } from "@/lib/supabase/client";

declare const google: {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        nonce?: string;
        use_fedcm_for_prompt?: boolean;
      }): void;
      renderButton(parent: HTMLElement, options: { type: "standard"; size: "large"; locale?: string }): void;
    };
  };
};

export function GoogleSignIn({ locale }: { locale: string }) {
  const t = useTranslations("SignIn");
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  async function init() {
    const { nonce, hashedNonce } = await generateNonce();
    google.accounts.id.initialize({
      client_id: googleWebClientId(),
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      callback: async ({ credential }) => {
        const { error } = await createClient().auth.signInWithIdToken({
          provider: "google",
          token: credential,
          nonce,
        });
        if (error) return setFailed(true);
        router.push("/app");
        router.refresh();
      },
    });
    google.accounts.id.renderButton(buttonRef.current!, { type: "standard", size: "large", locale });
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onReady={() => void init()} />
      <div ref={buttonRef} data-testid="google-button" />
      {failed && <p role="alert">{t("error")}</p>}
    </>
  );
}
