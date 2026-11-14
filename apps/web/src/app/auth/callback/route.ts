import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && sessionData?.user) {
      const user = sessionData.user;
      const email = user.email?.trim().toLowerCase();

      // Check if user is the designated Super Admin
      if (email === "hattn.23itb@vku.udn.vn") {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (url && serviceKey) {
          try {
            const adminClient = createAdminClient(url, serviceKey);
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

      if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      const role = (user.user_metadata as { role?: string } | undefined)?.role;
      const status = (user.user_metadata as { status?: string } | undefined)?.status;

      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      }
      if (role === "specialist") {
        if (status === "pending") {
          return NextResponse.redirect(new URL("/specialist?status=pending", requestUrl.origin));
        }
        return NextResponse.redirect(new URL("/specialist", requestUrl.origin));
      }
      if (role === "shop") {
        return NextResponse.redirect(new URL("/app?role=shop", requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/app", requestUrl.origin));
    }
    console.error("Supabase auth exchangeCodeForSession error:", error?.message);
  }

  return NextResponse.redirect(new URL("/app", requestUrl.origin));
}
