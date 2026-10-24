import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-nav";
import { DevSettings } from "./dev-settings";

// Screenshot fixture for the redesign build (ticket 09): Cài đặt without an account.
// ?delete=fail makes the dialog fail, otherwise deleting never resolves. 404 in production.
export default async function DevSettingsPage({ searchParams }: PageProps<"/dev/settings">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { delete: mode } = await searchParams;
  return (
    <AppShell>
      <DevSettings fail={mode === "fail"} />
    </AppShell>
  );
}
