import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInMarkSpots } from "../../signed-in";

export default async function SpotsPage({ params }: { params: Promise<{ photoId: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  const { photoId } = await params;
  return (
    <main className="flex flex-1 flex-col">
      <SignedInMarkSpots photoId={photoId} />
    </main>
  );
}
