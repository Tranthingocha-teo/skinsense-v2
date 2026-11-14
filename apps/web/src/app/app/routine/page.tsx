import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInRoutine } from "../signed-in";
import { AllocatedRoutineView } from "@/components/allocated-routine-view";

export default async function RoutinePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return (
    <main className="flex flex-1 flex-col pb-16">
      <SignedInRoutine />
      <div className="w-full border-t border-border my-6" />
      <AllocatedRoutineView />
    </main>
  );
}
