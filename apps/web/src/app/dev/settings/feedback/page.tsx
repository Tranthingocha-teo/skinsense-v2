import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-nav";
import { DevFeedback } from "./dev-feedback";

// Screenshot fixture for the redesign build (ticket 20): Góp ý without an account.
// ?send=fail shows the inline error; otherwise sending succeeds and returns to /dev/settings with the toast. 404 in production.
export default async function DevFeedbackPage({ searchParams }: PageProps<"/dev/settings/feedback">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { send } = await searchParams;
  return (
    <AppShell>
      <DevFeedback fail={send === "fail"} />
    </AppShell>
  );
}
