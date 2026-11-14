import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, role: "guest" });
    }

    const email = user.email?.trim().toLowerCase() || "";

    // 1. Super Admin
    if (email === "hattn.23itb@vku.udn.vn") {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email,
          fullName: "Trần Thị Ngọc Hà (Super Admin)",
          role: "admin",
          status: "active",
          isSuperAdmin: true,
        },
      });
    }

    // 2. Check Specialist registry from Supabase Storage
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let specialistRecord: any = null;

    if (url && serviceKey) {
      try {
        const adminClient = createAdminClient(url, serviceKey);
        const { data: signData } = await adminClient.storage
          .from("photos")
          .createSignedUrl("specialists/specialists_registry.json", 60);
        if (signData?.signedUrl) {
          const res = await fetch(signData.signedUrl + `&_t=${Date.now()}`, { cache: "no-store" });
          if (res.ok) {
            const list: any[] = await res.json();
            specialistRecord = list.find((s) => s.email?.toLowerCase() === email);
          }
        }
        if (!specialistRecord) {
          const { data: fileBlob } = await adminClient.storage
            .from("photos")
            .download("specialists/specialists_registry.json");
          if (fileBlob) {
            const list: any[] = JSON.parse(await fileBlob.text());
            specialistRecord = list.find((s) => s.email?.toLowerCase() === email);
          }
        }
      } catch {}
    }

    const meta = (user.user_metadata || {}) as Record<string, any>;
    const role = specialistRecord ? "specialist" : (meta.role || "customer");
    const status = specialistRecord?.status || meta.status || "active";

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email,
        fullName: specialistRecord?.name || meta.full_name || meta.name || email.split("@")[0],
        role,
        status,
        licenseId: specialistRecord?.licenseId || meta.license_id,
        hospital: specialistRecord?.hospital || meta.hospital,
        specialty: specialistRecord?.specialty || meta.specialty,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: "Failed to check session" }, { status: 500 });
  }
}
