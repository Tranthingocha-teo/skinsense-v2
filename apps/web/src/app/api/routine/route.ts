import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getProductForStep } from "@/lib/role-routines";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function downloadJsonFromStorage<T = any>(supabase: any, path: string): Promise<T | null> {
  try {
    const { data: signData } = await supabase.storage.from("photos").createSignedUrl(path, 60);
    if (signData?.signedUrl) {
      const res = await fetch(signData.signedUrl + `&_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        return (await res.json()) as T;
      }
    }
    const { data: fileBlob } = await supabase.storage.from("photos").download(path);
    if (fileBlob) {
      return JSON.parse(await fileBlob.text()) as T;
    }
  } catch {}
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeOfDay = searchParams.get("timeOfDay") || "evening"; // "morning" | "evening"
    const today = new Date().toISOString().split("T")[0];

    // 1. Get current authenticated user
    const supabaseServer = await createServerClient();
    let { data: { user } } = await supabaseServer.auth.getUser();

    const supabaseAdmin = getSupabaseAdmin();

    // If not found in cookie, check Authorization header (e.g. Bearer token / mobile app)
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        const { data: tokenData } = await supabaseAdmin.auth.getUser(token);
        if (tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    // Fallback if not authenticated (guest or demo)
    if (!user) {
      const demoSteps = (
        timeOfDay === "morning"
          ? [
              { label: "Rửa mặt dịu nhẹ", time: "morning" },
              { label: "Serum phục hồi B5", time: "morning" },
              { label: "Kem khóa ẩm mỏng nhẹ", time: "morning" },
              { label: "Kem chống nắng bảo vệ", time: "morning" },
            ]
          : [
              { label: "Tẩy trang dịu nhẹ", time: "evening" },
              { label: "Rửa mặt làm sạch sâu", time: "evening" },
              { label: "Serum trị mụn BHA", time: "evening" },
              { label: "Kem dưỡng phục hồi", time: "evening" },
            ]
      ).map((item, idx) => ({
        ...getProductForStep(item.label, timeOfDay as "morning" | "evening", idx),
        id: `demo-${timeOfDay}-${idx}`,
        stepNumber: idx + 1,
        label: item.label,
        isCompleted: idx === 0,
      }));

      return NextResponse.json({
        ok: true,
        userId: "demo",
        userEmail: "demo@skinsense.vn",
        userName: "Người dùng Khách",
        timeOfDay,
        night: today,
        title: timeOfDay === "morning" ? "Routine Sáng: Cấp Ẩm & Bảo Vệ Da" : "Routine Tối: Làm Sạch Sâu & Phục Hồi",
        description: timeOfDay === "morning" ? "Làm sạch dịu nhẹ pH 5.5, cấp nước phục hồi màng ẩm và chống nắng quang phổ rộng." : "Hòa tan bụi bẩn dầu nhờn, kháng khuẩn mụn và tái tạo biểu bì qua đêm.",
        allocatedBy: "Quy chuẩn Skincare SkinSense",
        isPrescribed: false,
        steps: demoSteps,
        completedCount: 1,
        totalCount: demoSteps.length,
        percent: 25,
      });
    }

    const userId = user.id;
    const userEmail = user.email?.trim().toLowerCase() || "";
    const meta = (user.user_metadata || {}) as Record<string, any>;
    const userName = meta.full_name || meta.name || userEmail.split("@")[0];

    // 2. Fetch today's completed ticks strictly for THIS USER from routine_entries
    const { data: userEntry } = await supabaseAdmin
      .from("routine_entries")
      .select("completed_labels, item_count")
      .eq("user_id", userId)
      .eq("night", today)
      .maybeSingle();

    const completedSet = new Set<string>(userEntry?.completed_labels || []);

    // 3. Find if this user has a personalized clinical prescription from specialist
    let prescribedRoutine: any = null;
    let prescriberName = "BS. CKI Nguyễn Mai Hoa";

    // Priority A: Check clinical records registry
    const registryCases = (await downloadJsonFromStorage<any[]>(supabaseAdmin, "clinical_records/cases_registry.json")) || [];
    
    // Check if user is Hà (support both her Google account and school email / names)
    const isHaUser =
      userEmail === "trandinhhai0936039127@gmail.com" ||
      userEmail === "hattn.23itb@vku.udn.vn" ||
      userEmail === "khachhang@gmail.com" ||
      userId === "365d9ffb-0ee5-41d2-879c-37ef337fe262" ||
      userId === "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33" ||
      userName.toLowerCase().includes("ngọc hà") ||
      userName.toLowerCase().includes("ngoc ha");

    const matchedCase = registryCases.find((c) => {
      if (c.patientUserId === userId || c.alternateUserId === userId || c.id === userId || c.userId === userId) return true;
      if (c.patientEmail && c.patientEmail.trim().toLowerCase() === userEmail) return true;
      if (c.alternateEmail && c.alternateEmail.trim().toLowerCase() === userEmail) return true;
      if (isHaUser && (
        c.patientName?.toLowerCase().includes("ngọc hà") ||
        c.patientName?.toLowerCase().includes("ngoc ha") ||
        c.patientEmail === "hattn.23itb@vku.udn.vn" ||
        c.patientEmail === "trandinhhai0936039127@gmail.com"
      )) {
        return true;
      }
      return false;
    });

    if (matchedCase?.currentRoutine && Array.isArray(matchedCase.currentRoutine.products) && matchedCase.currentRoutine.products.length > 0) {
      prescribedRoutine = matchedCase.currentRoutine;
      if (prescribedRoutine.prescribedBy) prescriberName = prescribedRoutine.prescribedBy;

      // Sync Postgres routine_items for THIS USER so that direct client queries are also updated
      try {
        await supabaseAdmin.from("routine_items").delete().eq("user_id", userId);
        for (let i = 0; i < prescribedRoutine.products.length; i++) {
          const p = prescribedRoutine.products[i];
          await supabaseAdmin.from("routine_items").insert({
            user_id: userId,
            label: p.name || p.label || p.productName,
            position: i,
          });
        }
      } catch {}
    }

    // Priority B: Check user-specific protocol in storage
    if (!prescribedRoutine) {
      const userProtocol = await downloadJsonFromStorage<any>(supabaseAdmin, `routines/protocol_${userId}.json`);
      if (userProtocol?.products && Array.isArray(userProtocol.products) && userProtocol.products.length > 0) {
        prescribedRoutine = userProtocol;
        if (userProtocol.prescribedBy) prescriberName = userProtocol.prescribedBy;
      }
    }

    let finalSteps: any[] = [];
    let routineTitle = "";
    let routineDescription = "";
    let isPrescribed = false;

    if (prescribedRoutine) {
      isPrescribed = true;
      routineTitle = prescribedRoutine.routineTitle || (timeOfDay === "morning" ? "Phác đồ Điều trị Chuyên khoa (Buổi Sáng)" : "Phác đồ Điều trị Chuyên khoa (Buổi Tối)");
      routineDescription = prescribedRoutine.doctorNotes || "Tuân thủ đều đặn theo phác đồ chỉ định của bác sĩ chuyên khoa da liễu.";

      const allProducts: any[] = prescribedRoutine.products;
      // Filter by time of day
      const filtered = allProducts.filter((p) => {
        const time = p.stepTime || "both";
        return time === "both" || time === timeOfDay;
      });
      const selectedProducts = filtered.length > 0 ? filtered : allProducts;

      finalSteps = selectedProducts.map((p, idx) => {
        const label = p.name || p.productName || p.label;
        const isCompleted = completedSet.has(label) || (p.productName && completedSet.has(p.productName));
        return {
          id: p.id || `step-${timeOfDay}-${idx}`,
          stepNumber: idx + 1,
          label,
          productName: p.name || p.productName || label,
          brand: p.brand || "Dược mỹ phẩm chỉ định",
          category: p.category || "Đặc trị phục hồi",
          imageUrl: p.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
          activeIngredients: p.activeIngredients || "Hoạt chất chuẩn y khoa",
          stepTime: p.stepTime || timeOfDay,
          dosage: p.dosage || "1 lượng vừa đủ",
          usageGuide: p.usageGuide || "Thoa đều và vỗ nhẹ cho ngấm sâu.",
          isCompleted: Boolean(isCompleted),
        };
      });
    } else {
      // Priority C: Load from Supabase Postgres routine_items for THIS USER
      const { data: dbItems } = await supabaseAdmin
        .from("routine_items")
        .select("id,label,position")
        .eq("user_id", userId)
        .order("position");

      let itemsToUse = dbItems || [];

      // If user has no items yet, seed default 4 steps for this user
      if (itemsToUse.length === 0) {
        const defaultLabels = ["Tẩy trang", "Rửa mặt", "Serum trị mụn", "Kem dưỡng ẩm"];
        try {
          await supabaseAdmin.from("routine_items").upsert(
            defaultLabels.map((label, pos) => ({ user_id: userId, label, position: pos })),
            { onConflict: "user_id,label", ignoreDuplicates: true }
          );
          const { data: reread } = await supabaseAdmin
            .from("routine_items")
            .select("id,label,position")
            .eq("user_id", userId)
            .order("position");
          itemsToUse = reread || [];
        } catch {}
      }

      routineTitle = timeOfDay === "morning"
        ? `Routine Sáng Cá Nhân · ${userName}`
        : `Routine Tối Cá Nhân · ${userName}`;
      routineDescription = timeOfDay === "morning"
        ? "Làm sạch dịu nhẹ pH 5.5, cấp nước phục hồi và chống nắng bảo vệ quang phổ rộng."
        : "Tẩy trang hòa tan bụi mịn và dầu nhờn, kháng khuẩn ngừa mụn và tái tạo màng ẩm ban đêm.";

      finalSteps = itemsToUse.map((item, idx) => {
        const prod = getProductForStep(item.label, timeOfDay as "morning" | "evening", idx);
        const isCompleted = completedSet.has(item.label) || (prod.productName && completedSet.has(prod.productName));
        return {
          id: item.id || `user-step-${idx}`,
          stepNumber: idx + 1,
          label: item.label,
          productName: prod.productName,
          brand: prod.brand,
          category: prod.category,
          imageUrl: prod.imageUrl,
          activeIngredients: prod.activeIngredients,
          stepTime: prod.stepTime || timeOfDay,
          dosage: prod.dosage,
          usageGuide: prod.usageGuide,
          isCompleted: Boolean(isCompleted),
        };
      });
    }

    const total = finalSteps.length;
    const completed = finalSteps.filter((s) => s.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      ok: true,
      userId,
      userEmail,
      userName,
      timeOfDay,
      night: today,
      allocatedBy: isPrescribed ? prescriberName : `Cá nhân (${userName})`,
      treatmentDuration: isPrescribed ? "Phác đồ chỉ định 14 ngày" : "Chăm sóc da hàng ngày",
      skinConcern: isPrescribed ? "Theo dõi & Phục hồi chuyên sâu" : "Duy trì hàng rào bảo vệ da",
      title: routineTitle,
      description: routineDescription,
      isPrescribed,
      steps: finalSteps,
      completedCount: completed,
      totalCount: total,
      percent,
      postgresTable: "public.routine_entries (user_id scoped)",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lỗi tải dữ liệu Supabase" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    let { data: { user } } = await supabaseServer.auth.getUser();

    const supabaseAdmin = getSupabaseAdmin();

    // If not found in cookie, check Authorization header (e.g. Bearer token / mobile app)
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        const { data: tokenData } = await supabaseAdmin.auth.getUser(token);
        if (tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để lưu routine." }, { status: 401 });
    }

    const body = await request.json();
    const { label, isCompleted, night } = body;

    if (!label) {
      return NextResponse.json({ error: "Thiếu tên bước cần tích." }, { status: 400 });
    }

    const userId = user.id;
    const targetNight = night || new Date().toISOString().split("T")[0];

    // Read current entry strictly for THIS USER from routine_entries
    const { data: currentEntry } = await supabaseAdmin
      .from("routine_entries")
      .select("completed_labels, item_count")
      .eq("user_id", userId)
      .eq("night", targetNight)
      .maybeSingle();

    let completedList: string[] = currentEntry?.completed_labels || [];

    if (isCompleted) {
      if (!completedList.includes(label)) {
        completedList.push(label);
      }
    } else {
      completedList = completedList.filter((l) => l !== label);
    }

    // Upsert strictly for THIS USER
    const { error: upsertErr } = await supabaseAdmin.from("routine_entries").upsert({
      user_id: userId,
      night: targetNight,
      completed_labels: completedList,
      item_count: currentEntry?.item_count || 4,
    }, { onConflict: "user_id,night" });

    if (upsertErr) {
      throw new Error(upsertErr.message);
    }

    return NextResponse.json({
      ok: true,
      message: isCompleted ? `Đã hoàn thành bước: ${label}` : `Đã bỏ tích: ${label}`,
      userId,
      night: targetNight,
      completedLabels: completedList,
      completedCount: completedList.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật Supabase thất bại" }, { status: 500 });
  }
}
