import { AppShell } from "@/components/app-nav";
import { OnboardingGate } from "@/components/onboarding";

// No auth gate here: every page under /app keeps its own getClaims() check.
// Onboarding (ticket 13) sits in front of signed-in pages only; /demo has its own layout.
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <OnboardingGate>
      <AppShell>{children}</AppShell>
    </OnboardingGate>
  );
}
