import { preconnect } from "react-dom";
import { redirect } from "next/navigation";
import { Capture } from "@/components/capture";
import { createClient } from "@/lib/supabase/server";

export default async function CapturePage() {
  // Open the connections to where the unchanged analysis model and its WASM are fetched from, so the
  // TLS handshakes overlap the page's own work instead of starting after it. Nothing is fetched here.
  preconnect("https://storage.googleapis.com", { crossOrigin: "anonymous" });
  preconnect("https://cdn.jsdelivr.net", { crossOrigin: "anonymous" });
  preconnect("https://cdn.jsdelivr.net");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  return (
    <main className="flex flex-1 flex-col">
      <Capture />
    </main>
  );
}
