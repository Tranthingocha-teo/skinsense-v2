import { Suspense } from "react";
import { AuthErrorNotice } from "@/components/auth-error-notice";
import { Landing } from "@/components/landing";

export default function LandingPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorNotice />
      </Suspense>
      <Landing />
    </>
  );
}
