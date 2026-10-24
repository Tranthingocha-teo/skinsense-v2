import { redirect } from "next/navigation";
import { SignedInFeedback } from "@/app/app/signed-in";
import { createClient } from "@/lib/supabase/server";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return <SignedInFeedback />;
}
