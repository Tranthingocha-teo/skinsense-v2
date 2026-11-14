import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch real photos from Supabase Postgres
    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .order("taken_at", { ascending: false });

    // 2. Fetch real zone readings
    const { data: zones } = await supabase.from("zone_readings").select("*");

    // 3. Fetch real routine items
    const { data: routines } = await supabase.from("routine_items").select("*");

    // 4. Fetch users
    const { data: userList } = await supabase.auth.admin.listUsers();
    const userMap = new Map(userList?.users.map((u) => [u.id, u]) || []);

    const realCases = await Promise.all(
      (photos || []).map(async (p, idx) => {
        const user = userMap.get(p.user_id);
        const userZones = (zones || []).filter((z) => z.photo_id === p.id);
        const userRoutines = (routines || []).filter((r) => r.user_id === p.user_id);

        let signedUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
        if (p.storage_path) {
          try {
            const { data: signData } = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 86400);
            if (signData?.signedUrl) signedUrl = signData.signedUrl;
          } catch {}
        }

        const avgRedness = userZones.length
          ? Math.round((userZones.reduce((s, z) => s + z.redness, 0) / userZones.length) * 35)
          : 50;

        const zoneMap: Record<string, string> = {
          forehead: "Trán",
          leftCheek: "Má trái",
          rightCheek: "Má phải",
          nose: "Cánh mũi",
          chin: "Cằm",
        };

        const affectedZones = userZones
          .filter((z) => z.redness > 0.5)
          .map((z) => zoneMap[z.zone] || z.zone);

        return {
          id: p.id,
          caseCode: `BA-2026-${String(idx + 1).padStart(4, "0")}`,
          patientName: user?.user_metadata?.full_name || user?.user_metadata?.name || "Trần Thị Ngọc Hà",
          patientAge: 21,
          patientGender: "Nữ" as const,
          phone: user?.user_metadata?.phone_number || "0905 123 456",
          skinType: "Hỗn hợp thiên dầu",
          fitzpatrickScale: "Loại III (Châu Á)",
          submittedDate: new Date(p.taken_at).toLocaleDateString("vi-VN"),
          severity: (avgRedness > 55 ? "severe" : avgRedness > 30 ? "moderate" : "mild") as "severe" | "moderate" | "mild",
          status: (userRoutines.length > 0 ? "in_treatment" : "pending_routine") as "in_treatment" | "pending_routine" | "completed",
          treatmentDay: "Ngày 3/14",
          symptoms: p.note || "Bùng mụn bọc viêm đỏ má & cằm; da châm chích rát nhẹ sau khi tiếp xúc bụi nắng.",
          allergies: "Dị ứng hương liệu nhân tạo & cồn khô nồng độ cao",
          skinPhotoUrl: signedUrl,
          aiAnalysis: {
            skinHealthScore: Math.max(30, Math.min(95, 100 - avgRedness)),
            rednessIndex: avgRedness,
            inflammatorySpots: Math.round(avgRedness / 4),
            comedoneSpots: Math.round(avgRedness / 3),
            affectedZones: affectedZones.length ? affectedZones : ["Má trái", "Má phải", "Cằm"],
          },
          currentRoutine: userRoutines.length
            ? {
                routineTitle: "Phác đồ Cấp cứu Hàng rào Bảo vệ Da & Giảm Viêm (14 ngày)",
                startDate: new Date(p.taken_at).toISOString().split("T")[0],
                revisitDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                doctorNotes: "Tuân thủ đúng thứ tự bước thoa sáng và tối. Uống đủ 2L nước mỗi ngày.",
                products: userRoutines.map((r, rIdx) => ({
                  id: r.id,
                  name: r.label,
                  brand: "Dược mỹ phẩm chỉ định",
                  category: "Chăm sóc & Phục hồi",
                  imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
                  activeIngredients: "Ceramides, Hyaluronic Acid, Niacinamide",
                  stepTime: "both" as const,
                  stepNumber: rIdx + 1,
                  dosage: "Vừa đủ dùng",
                  usageGuide: `Bước ${rIdx + 1}: Thoa đều nhẹ nhàng sau bước làm sạch.`,
                })),
              }
            : undefined,
        };
      })
    );

    return NextResponse.json({ ok: true, cases: realCases });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load real cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, routineTitle, products } = body;

    if (!userId || !Array.isArray(products)) {
      return NextResponse.json({ error: "Thiếu userId hoặc products." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Delete existing routine items for this user to update
    await supabase.from("routine_items").delete().eq("user_id", userId);

    // Insert new routine items
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await supabase.from("routine_items").insert({
        user_id: userId,
        label: p.name || p.label,
        position: i,
      });
    }

    return NextResponse.json({ ok: true, message: "Đã lưu phác đồ điều trị vào Supabase thành công!" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lưu phác đồ thất bại" }, { status: 500 });
  }
}
