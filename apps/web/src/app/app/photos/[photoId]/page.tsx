import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInPhotoDetail } from "../../signed-in";

export default async function PhotoPage({ params }: PageProps<"/app/photos/[photoId]">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");
  const { photoId } = await params;
  return <SignedInPhotoDetail photoId={photoId} />;
}
