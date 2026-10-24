import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInRoutine } from "../signed-in";

export default async function RoutinePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return (
    <main className="flex flex-1 flex-col">
      <SignedInRoutine />
    </main>
  );
}
