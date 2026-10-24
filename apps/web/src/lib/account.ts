import { createClient } from "@/lib/supabase/client";

// Storage objects + rows + auth user go on the server (Edge Function `delete-account`);
// the user is gone once it returns, so only the local cookie session is left to clear.
export async function deleteAccount() {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}

export async function signOut() {
  await createClient().auth.signOut();
}
