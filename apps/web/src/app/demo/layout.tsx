import { AppShell } from "@/components/app-nav";
import { DemoBanner } from "@/components/demo-banner";

// Public on purpose: proxy.ts gates only /app. Same shell as /app, plus the banner.
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <AppShell>
      <DemoBanner />
      {children}
    </AppShell>
  );
}
