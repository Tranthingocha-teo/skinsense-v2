import { redirect } from "next/navigation";
import { Capture } from "@/components/capture";
import { createClient } from "@/lib/supabase/server";

export default async function CapturePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return (
    <main className="flex flex-1 flex-col">
      <Capture />
    </main>
  );
}
