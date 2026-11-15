import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isPatientAliasOfHa, filterProductsByTimeOfDay } from "@/lib/prescription-sync";

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

    // Fallback if not authenticated (guest or demo) - Strict: No Mock Data, Empty if None
    if (!user) {
      return NextResponse.json({
        ok: true,
        userId: "demo",
        userEmail: "demo@skinsense.vn",
        userName: "Người dùng Khách",
        timeOfDay,
        night: today,
        title: "Chưa có routine nào được thiết lập",
        description: "Vui lòng đăng nhập tài khoản để xem phác đồ chăm sóc da của riêng bạn (Để trống, không dùng dữ liệu mẫu).",
        allocatedBy: "Hệ thống SkinSense",
        isPrescribed: false,
        steps: [],
        completedCount: 0,
        totalCount: 0,
        percent: 0,
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
    
    const userRole = meta.role || (userEmail === "hattn.23itb@vku.udn.vn" ? "admin" : "customer");
    const isDoctor = userRole === "specialist" || userEmail.includes("doctor") || userEmail.includes("bacsi") || userEmail.includes("lananh");
    const isAdmin = userRole === "admin" || userEmail === "admin@skinsense.vn";

    // Phân quyền độc lập (của ai hiển thị cái đó, không mẫu, nếu chưa có thì để trống):
    // Bác sĩ và Admin không tự động gán bệnh án người bệnh.
    const isPatientUser = !isDoctor && !isAdmin;
    const isHaPatient = isPatientUser && isPatientAliasOfHa({ userId, email: userEmail, name: userName });

    const matchedCase = isPatientUser ? registryCases.find((c) => {
      if (c.patientUserId === userId || c.alternateUserId === userId || c.id === userId || c.userId === userId) return true;
      if (c.patientEmail && c.patientEmail.trim().toLowerCase() === userEmail) return true;
      if (c.alternateEmail && c.alternateEmail.trim().toLowerCase() === userEmail) return true;
      if (isHaPatient && (
        c.patientName?.toLowerCase().includes("ngọc hà") ||
        c.patientName?.toLowerCase().includes("ngoc ha") ||
        c.patientEmail === "trandinhhai0936039127@gmail.com"
      )) {
        return true;
      }
      return false;
    }) : null;

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

    // Priority B: Check user-specific protocol in storage (chỉ dành cho tài khoản bệnh nhân)
    if (!prescribedRoutine && isPatientUser) {
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
      // Priority C: Load from Supabase Postgres routine_items strictly for THIS USER
      const { data: dbItems } = await supabaseAdmin
        .from("routine_items")
        .select("id,label,position")
        .eq("user_id", userId)
        .order("position");

      const itemsToUse = dbItems || [];

      // If user has no items yet: DO NOT seed mock data! Leave empty!
      // "của ai hiển thị cái đó , chứ ko mẫu .Nếu chưa có thì để trống"
      if (itemsToUse.length === 0) {
        routineTitle = timeOfDay === "morning"
          ? `Routine Sáng · ${userName}`
          : `Routine Tối · ${userName}`;
        routineDescription = "Chưa có bước chăm sóc da nào được thiết lập cho tài khoản này (Để trống, không dùng dữ liệu mẫu).";
        finalSteps = [];
      } else {
        routineTitle = timeOfDay === "morning"
          ? `Routine Sáng Cá Nhân · ${userName}`
          : `Routine Tối Cá Nhân · ${userName}`;
        routineDescription = timeOfDay === "morning"
          ? "Làm sạch dịu nhẹ pH 5.5, cấp nước phục hồi và chống nắng bảo vệ quang phổ rộng."
          : "Tẩy trang hòa tan bụi mịn và dầu nhờn, kháng khuẩn ngừa mụn và tái tạo màng ẩm ban đêm.";

        finalSteps = itemsToUse.map((item, idx) => {
          const isCompleted = completedSet.has(item.label);
          return {
            id: item.id || `user-step-${idx}`,
            stepNumber: idx + 1,
            label: item.label,
            // Không tự động chèn sản phẩm mẫu giả lập (CeraVe / La Roche-Posay)
            productName: null,
            brand: null,
            category: null,
            imageUrl: null,
            activeIngredients: null,
            stepTime: timeOfDay,
            dosage: null,
            usageGuide: null,
            isCompleted: Boolean(isCompleted),
          };
        });
      }
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
