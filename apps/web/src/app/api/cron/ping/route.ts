import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env";

// Keep-alive for Supabase Free's 7-day inactivity pause (ticket 14): one cheap,
// side-effect-free query a day. Not a user surface; nothing sensitive is returned.
export async function GET() {
  const { url, anonKey } = supabaseEnv();
  const supabase = createClient(url, anonKey);
  const { error } = await supabase.from("photos").select("id", { head: true, count: "exact" });
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}
