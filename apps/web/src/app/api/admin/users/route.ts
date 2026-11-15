import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRoleActor } from "@/lib/session-auth";
import { randomUUID } from "node:crypto";
import { authzClaims } from "@/lib/actor-role";
import { shopIdClaim } from "@/lib/shop-utils";
import { downloadStorageJson } from "@/lib/supabase/storage-json";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const users = data.users.map((u) => {
      const meta = u.user_metadata || {};
      const isSuperAdmin = u.email?.toLowerCase() === "hattn.23itb@vku.udn.vn";
      const appMeta = u.app_metadata || {};
      // app_metadata is the authoritative role; user_metadata is only a fallback label for old accounts.
      const role = isSuperAdmin ? "admin" : (appMeta.role || meta.role || "customer");
      const status = isSuperAdmin ? "active" : (appMeta.status || meta.status || "active");

      return {
        id: u.id,
        name: isSuperAdmin
          ? "Trần Thị Ngọc Hà (Super Admin)"
          : (meta.full_name || meta.name || u.email?.split("@")[0] || "Người dùng"),
        email: u.email || "",
        phone: meta.phone_number || u.phone || "0905 123 456",
        role,
        status,
        createdAt: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        avatarUrl: meta.avatar_url || meta.picture,
        shopDetails: role === "shop" ? {
          shopName: meta.shop_name || "Cửa Hàng Dược Mỹ Phẩm SkinSense",
          license: meta.license || "GPKD-882910-HCM",
          category: meta.category || "Dược mỹ phẩm chăm sóc & phục hồi da",
          address: meta.address || "Quận 1, TP. Hồ Chí Minh",
        } : undefined,
        specialistDetails: role === "specialist" ? {
          hospital: meta.hospital || "Bệnh viện Da Liễu Trung Ương",
          licenseId: meta.license_id || "CCHN-003419/BYT",
          specialty: meta.specialty || "Da liễu thẩm mỹ & Trị mụn",
        } : undefined,
      };
    });

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load real users." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    // No shared default password: an account created without one gets a random password nobody
    // knows and signs in with Google or a magic link. ("password123@" let anyone into it.)
    const { email, password = `${randomUUID()}Aa1!`, fullName, role = "customer", phone, shopName, specialty, hospital, licenseId } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    if (!["customer", "shop", "specialist"].includes(role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();
    const initialStatus = role === "specialist" ? "pending" : "active";

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: { ...authzClaims(role, initialStatus), ...shopIdClaim(role, {}, { shop_name: shopName }) },
      user_metadata: {
        full_name: fullName?.trim() || normalizedEmail.split("@")[0],
        role,
        status: initialStatus,
        phone_number: phone?.trim() || "",
        shop_name: shopName?.trim() || "",
        specialty: specialty?.trim() || "",
        hospital: hospital?.trim() || "",
        license_id: licenseId?.trim() || "",
        created_at_local: new Date().toISOString(),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tạo người dùng thất bại." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userRes, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (fetchErr || !userRes.user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    if (role !== undefined && !["customer", "shop", "specialist"].includes(role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }

    const currentApp = (userRes.user.app_metadata || {}) as Record<string, unknown>;
    const currentMeta = (userRes.user.user_metadata || {}) as Record<string, unknown>;
    const nextRole = (role || currentApp.role || currentMeta.role || "customer") as "customer" | "shop" | "specialist";
    const nextStatus = String(status || currentApp.status || currentMeta.status || "active");

    const updatedMetadata = {
      ...userRes.user.user_metadata,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata,
      ...(role || status
        ? { app_metadata: { ...authzClaims(nextRole, nextStatus), ...shopIdClaim(nextRole, currentApp, currentMeta) } }
        : {}),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sync status change to shops/shops_registry.json if user is a shop
    const userEffectiveRole = role || userRes.user.user_metadata?.role;
    if (userEffectiveRole === "shop" && status) {
      try {
        const email = userRes.user.email?.toLowerCase();
        // Cache-busted read (storage .download() can be stale; writing a stale list back lost entries).
        let registry =
          (await downloadStorageJson<Array<{ id?: string; email?: string; status?: string }>>("shops/shops_registry.json", supabaseAdmin)) ?? [];
        registry = registry.map((s) =>
          s.email?.toLowerCase() === email || s.id === userId ? { ...s, status } : s
        );
        await supabaseAdmin.storage.from("photos").upload(
          "shops/shops_registry.json",
          Buffer.from(JSON.stringify(registry, null, 2)),
          { upsert: true, contentType: "application/json" }
        );
      } catch (syncErr) {
        console.warn("Lỗi đồng bộ shops_registry.json:", syncErr);
      }
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cập nhật người dùng thất bại." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Đã xóa người dùng thành công." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Xóa người dùng thất bại." },
      { status: 500 },
    );
  }
}
