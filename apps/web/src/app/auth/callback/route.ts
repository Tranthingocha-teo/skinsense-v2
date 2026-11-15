import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      const email = user.email?.trim().toLowerCase() || "";

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const adminClient = url && serviceKey ? createAdminClient(url, serviceKey) : null;

      // 1. Check if user is the designated Super Admin
      if (email === "hattn.23itb@vku.udn.vn") {
        if (adminClient) {
          try {
            await adminClient.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...user.user_metadata,
                role: "admin",
                status: "active",
                is_super_admin: true,
                full_name: "Trần Thị Ngọc Hà (Super Admin)",
              },
            });
          } catch (e) {
            console.error("Error setting admin role for hattn.23itb@vku.udn.vn:", e);
          }
        }
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      }

      // 2. Check Specialist Registry in Supabase Storage & Supabase Auth metadata
      interface SpecialistRegistryEntry {
        email?: string;
        status?: string;
        name?: string;
        licenseId?: string;
        hospital?: string;
      }
      let specialistRecord: SpecialistRegistryEntry | null = null;
      if (adminClient) {
        try {
          const { data: signData } = await adminClient.storage
            .from("photos")
            .createSignedUrl("specialists/specialists_registry.json", 60);
          if (signData?.signedUrl) {
            const res = await fetch(signData.signedUrl + `&_t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
              const registry = (await res.json()) as SpecialistRegistryEntry[];
              specialistRecord = registry.find((s) => s.email?.toLowerCase() === email) ?? null;
            }
          }
          if (!specialistRecord) {
            const { data: fileBlob } = await adminClient.storage
              .from("photos")
              .download("specialists/specialists_registry.json");
            if (fileBlob) {
              const registry = JSON.parse(await fileBlob.text()) as SpecialistRegistryEntry[];
              specialistRecord = registry.find((s) => s.email?.toLowerCase() === email) ?? null;
            }
          }
        } catch {}
      }

      const meta = (user.user_metadata || {}) as Record<string, string | undefined>;

      // Display routing only; API rights come from app_metadata (lib/actor-role.ts).
      const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.role;
      const isSpecialistRole = appRole === "specialist" || meta.role === "specialist" || Boolean(specialistRecord);

      const specialistStatus = specialistRecord?.status || meta.status || "active";

      // If user is a specialist, route to Specialist Portal, NEVER customer /app!
      if (isSpecialistRole) {
        if (adminClient && meta.role !== "specialist") {
          try {
            await adminClient.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...meta,
                role: "specialist",
                status: specialistStatus,
                full_name: specialistRecord?.name || meta.full_name || meta.name || "Bác sĩ Da liễu",
                license_id: specialistRecord?.licenseId || meta.license_id || "014289/BYT-CCHN",
                hospital: specialistRecord?.hospital || meta.hospital || "Bệnh viện Da Liễu Trung Ương",
              },
            });
          } catch {}
        }

        if (specialistStatus === "pending") {
          return NextResponse.redirect(new URL("/specialist?status=pending", requestUrl.origin));
        }
        return NextResponse.redirect(new URL("/specialist", requestUrl.origin));
      }

      const role = meta.role;
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      }
      if (role === "shop") {
        return NextResponse.redirect(new URL("/shop", requestUrl.origin));
      }

      // If customer requested a specific page (other than /app)
      if (next && next !== "/app") {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      return NextResponse.redirect(new URL("/app", requestUrl.origin));
    }
    console.error("Supabase auth exchangeCodeForSession error:", error?.message);
  }

  return NextResponse.redirect(new URL("/app", requestUrl.origin));
}
