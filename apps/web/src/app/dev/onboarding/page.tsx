import { notFound } from "next/navigation";
import { DevOnboarding } from "./dev-onboarding";

// Screenshot fixture for the redesign build (ticket 13): onboarding without an account or the local flag. 404 in production.
export default function DevOnboardingPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevOnboarding />;
}
