import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedActor } from "@/lib/session-auth";
import { authzClaims, SUPER_ADMIN_EMAIL } from "@/lib/actor-role";
import { shopIdClaim } from "@/lib/shop-utils";
import { updateStorageJsonList } from "@/lib/supabase/storage-json";
import { listAllUsers } from "@/lib/admin-approvals";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      ownerName,
      doctorName,
      role = "customer",
      phoneNumber,
      shopName,
      specialty,
      licenseId,
      hospital,
      license,
      category,
      address,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Vui lòng nhập email." }, { status: 400 });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Máy chủ chưa cấu hình Supabase Service Key." }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();
    if (!["customer", "shop", "specialist"].includes(role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }
    if (normalizedEmail === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Email này không thể đăng ký qua biểu mẫu." }, { status: 409 });
    }
    const effectiveRole = role as "customer" | "shop" | "specialist";

    // Specialists & Shops start as "pending" until an admin approves them.
    const status = effectiveRole === "specialist" || effectiveRole === "shop" ? "pending" : "active";

    const effectiveFullName = (fullName || ownerName || doctorName || shopName || normalizedEmail.split("@")[0]).trim();

    const userMetadata = {
      full_name: effectiveFullName,
      name: effectiveFullName,
      role: effectiveRole,
      status,
      phone_number: phoneNumber?.trim() || "",
      shop_name: shopName?.trim() || fullName?.trim() || "",
      license: license?.trim() || licenseId?.trim() || "",
      category: category?.trim() || specialty?.trim() || "",
      address: address?.trim() || hospital?.trim() || "",
      specialty: specialty?.trim() || "Chuyên khoa Da liễu & Thẩm mỹ Da",
      license_id: licenseId?.trim() || license?.trim() || "Đang chờ duyệt CCHN",
      hospital: hospital?.trim() || address?.trim() || "Bệnh viện Da liễu",
      shop_details: effectiveRole === "shop" ? {
        shopName: shopName?.trim() || fullName?.trim() || "Gian hàng mới",
        license: license?.trim() || licenseId?.trim() || "GPKD-Đang chờ duyệt",
        category: category?.trim() || specialty?.trim() || "Dược mỹ phẩm & Chăm sóc da",
        address: address?.trim() || hospital?.trim() || "Việt Nam",
      } : undefined,
      submitted_at: new Date().toISOString(),
    };

    // 1. Check if user already exists
    // Every page: one listUsers call stops at 1000 accounts, and a returning applicant beyond that
    // was treated as new and failed with "already registered".
    const existingUser = (await listAllUsers(supabaseAdmin)).find((u) => u.email?.toLowerCase() === normalizedEmail);

    let savedUser = null;

    if (existingUser) {
      // Only the signed-in owner of this email may change its application. Without this check
      // anyone could rewrite another account's role and profile by posting its email.
      const actor = await getAuthenticatedActor(request);
      if (!actor || actor.email !== normalizedEmail) {
        return NextResponse.json(
          { error: "Email đã được đăng ký. Vui lòng đăng nhập bằng email này rồi gửi lại hồ sơ." },
          { status: 409 },
        );
      }
      const currentApp = (existingUser.app_metadata || {}) as Record<string, unknown>;
      const alreadyApproved = currentApp.role === effectiveRole && currentApp.status === "active";
      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          ...userMetadata,
          ...(alreadyApproved ? { status: "active" } : {}),
        },
        ...(alreadyApproved
          ? {}
          : { app_metadata: { ...authzClaims(effectiveRole, status), ...shopIdClaim(effectiveRole, currentApp, userMetadata) } }),
      });
      if (updateErr) throw new Error(updateErr.message);
      savedUser = updated.user;
    } else {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        app_metadata: { ...authzClaims(effectiveRole, status), ...shopIdClaim(effectiveRole, {}, userMetadata) },
        user_metadata: userMetadata,
      });

      if (createErr) throw new Error(createErr.message);
      savedUser = created.user;
    }

    // The registry mirrors the status app_metadata really has (an approved account that resubmits
    // its details stays approved), and is written under the store lock. A failed read used to be
    // taken for an empty registry and written back with only this entry, wiping every application.
    const savedApp = (savedUser?.app_metadata ?? {}) as Record<string, unknown>;
    const registryStatus = typeof savedApp.status === "string" ? savedApp.status : status;
    const replaceRegistryEntry = (path: string, entry: Record<string, unknown>) =>
      updateStorageJsonList<Record<string, unknown>, void>(path, supabaseAdmin, (registry) => ({
        next: [
          ...registry.filter((s) => (typeof s.email === "string" ? s.email.toLowerCase() : "") !== normalizedEmail),
          entry,
        ],
        result: undefined,
      }));

    // 2. If specialist, also record in Supabase Storage specialists_registry.json
    if (effectiveRole === "specialist") {
      try {
        const specialistEntry = {
          id: savedUser?.id || `spec_${Date.now()}`,
          email: normalizedEmail,
          name: userMetadata.full_name,
          title: "Bác sĩ Chuyên khoa Da liễu",
          licenseId: userMetadata.license_id,
          hospital: userMetadata.hospital,
          phone: userMetadata.phone_number,
          specialty: userMetadata.specialty,
          status: registryStatus,
          avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
          submittedAt: userMetadata.submitted_at,
        };

        await replaceRegistryEntry("specialists/specialists_registry.json", specialistEntry);
      } catch (e: unknown) {
        console.warn("Lỗi lưu specialists_registry:", e instanceof Error ? e.message : String(e));
      }
    }

    // 3. If shop, also record in Supabase Storage shops_registry.json
    if (effectiveRole === "shop") {
      try {
        const shopEntry = {
          id: savedUser?.id || `shop_${Date.now()}`,
          email: normalizedEmail,
          ownerName: userMetadata.full_name,
          shopName: userMetadata.shop_name,
          license: userMetadata.license,
          category: userMetadata.category,
          address: userMetadata.address,
          phone: userMetadata.phone_number,
          status: registryStatus,
          avatarUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
          submittedAt: userMetadata.submitted_at,
        };

        await replaceRegistryEntry("shops/shops_registry.json", shopEntry);
      } catch (e: unknown) {
        console.warn("Lỗi lưu shops_registry:", e instanceof Error ? e.message : String(e));
      }
    }

    return NextResponse.json({
      ok: true,
      user: savedUser ? { id: savedUser.id, email: savedUser.email } : null,
      status,
      message:
        effectiveRole === "specialist"
          ? "Hồ sơ Bác sĩ đã được gửi thành công tới Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn) để xét duyệt!"
          : effectiveRole === "shop"
          ? "Hồ sơ mở Gian hàng đã được gửi thành công tới Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn) để xét duyệt!"
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Đăng ký thất bại, vui lòng thử lại." },
      { status: 500 },
    );
  }
}
