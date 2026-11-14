import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInToday } from "./signed-in";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Non-optimistic auth gate: if not signed in, redirect to landing
  if (!data?.claims) redirect("/");

  return (
    <main className="flex flex-1 flex-col">
      <SignedInToday />
    </main>
  );
}
