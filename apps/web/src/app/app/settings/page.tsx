import { redirect } from "next/navigation";
import { SignedInSettings } from "@/app/app/signed-in";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  // Google puts the display name in user_metadata (full_name, or name on some accounts) and the avatar in picture.
  const meta = data.claims.user_metadata as { full_name?: string; name?: string; picture?: string } | undefined;
  return <SignedInSettings account={{ name: meta?.full_name ?? meta?.name, email: String(data.claims.email), picture: meta?.picture }} />;
}
