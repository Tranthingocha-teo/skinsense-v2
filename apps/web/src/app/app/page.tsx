import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignedInToday } from "./signed-in";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Non-optimistic auth gate
  if (!data?.claims) redirect("/");

  const claims = data.claims as Record<string, any>;
  const email = ((claims?.email as string) || "").trim().toLowerCase();
  const meta = (claims?.user_metadata || {}) as Record<string, any>;
  const role = meta.role;
  const status = meta.status;

  const isDoctorEmail =
    email.includes("doctor") ||
    email.includes("bacsi") ||
    email.startsWith("dr.") ||
    email.includes("dr_") ||
    email.includes("dr-") ||
    email === "bacsi.hoa@skinsense.vn" ||
    email === "dr.ha@gmail.com" ||
    email === "dr.lananh@skinsense.vn" ||
    email === "thuydung.doctor@gmail.com";

  if (role === "specialist" || isDoctorEmail) {
    if (status === "pending") redirect("/specialist?status=pending");
    redirect("/specialist");
  }

  if (email === "hattn.23itb@vku.udn.vn" || role === "admin") {
    redirect("/admin");
  }

  if (role === "shop") {
    redirect("/shop");
  }

  return (
    <main className="flex flex-1 flex-col">
      <SignedInToday />
    </main>
  );
}
