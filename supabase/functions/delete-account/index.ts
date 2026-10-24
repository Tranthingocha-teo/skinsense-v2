import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Deletes the calling user (ticket 11). Storage objects go first: auth.users
// rows owning objects cannot be deleted; the domain tables cascade from auth.users.
// Deployed with verify_jwt off: the gateway check 401s the browser's CORS
// preflight (no Authorization header on OPTIONS), so the user is verified here.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.auth.getUser(token);
  if (!data.user) return new Response("Unauthorized", { status: 401, headers: cors });
  const id = data.user.id;

  const photos = admin.storage.from("photos");
  for (;;) {
    const { data: objects, error } = await photos.list(id, { limit: 1000 });
    if (error) return new Response(error.message, { status: 500, headers: cors });
    if (!objects.length) break;
    const { error: removeError } = await photos.remove(objects.map((o) => `${id}/${o.name}`));
    if (removeError) return new Response(removeError.message, { status: 500, headers: cors });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return new Response(error.message, { status: 500, headers: cors });
  return new Response(null, { status: 204, headers: cors });
});
