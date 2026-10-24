import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInHistory } from "../signed-in";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return <SignedInHistory />;
}
