import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInToday } from "./signed-in";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // proxy.ts already gates /app; this is the non-optimistic check Next's auth guide asks for.
  if (!data?.claims) redirect("/");
  return (
    <main className="flex flex-1 flex-col">
      <SignedInToday />
    </main>
  );
}
