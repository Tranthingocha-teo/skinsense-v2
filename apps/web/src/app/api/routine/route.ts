import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeOfDay = searchParams.get("timeOfDay") || "evening"; // "morning" | "evening"
    const today = new Date().toISOString().split("T")[0];

    const supabase = getSupabaseAdmin();

    // 1. Download real protocol stored in Supabase Storage
    let protocolData: any = null;
    const { data: fileBlob, error: fileError } = await supabase.storage
      .from("photos")
      .download("real_routine_protocol.json");

    if (fileBlob) {
      const text = await fileBlob.text();
      protocolData = JSON.parse(text);
    }

    if (!protocolData) {
      return NextResponse.json({ error: "Không tìm thấy dữ liệu routine trên Supabase." }, { status: 404 });
    }

    // 2. Fetch today's completed ticks from Supabase Postgres routine_entries
    const adminUserId = "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33";
    const { data: entry } = await supabase
      .from("routine_entries")
      .select("completed_labels, item_count")
      .eq("night", today)
      .eq("user_id", adminUserId)
      .maybeSingle();

    const completedSet = new Set<string>(entry?.completed_labels || []);

    // 3. Filter steps according to timeOfDay (morning vs evening)
    const activeSection = timeOfDay === "morning" ? protocolData.morning : protocolData.evening;
    const stepsWithTicks = activeSection.steps.map((st: any) => ({
      ...st,
      isCompleted: completedSet.has(st.label) || Boolean(st.isCompleted),
    }));

    const total = stepsWithTicks.length;
    const completed = stepsWithTicks.filter((s: any) => s.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      ok: true,
      timeOfDay,
      night: today,
      allocatedBy: protocolData.allocatedBy,
      targetUser: protocolData.targetUser,
      treatmentDuration: protocolData.treatmentDuration,
      skinConcern: protocolData.skinConcern,
      title: activeSection.title,
      description: activeSection.description,
      steps: stepsWithTicks,
      completedCount: completed,
      totalCount: total,
      percent,
      storageSource: "supabase://photos/real_routine_protocol.json",
      postgresTable: "public.routine_entries",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lỗi tải dữ liệu Supabase" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { label, isCompleted, night } = body;

    if (!label) {
      return NextResponse.json({ error: "Thiếu tên bước cần tích." }, { status: 400 });
    }

    const targetNight = night || new Date().toISOString().split("T")[0];
    const supabase = getSupabaseAdmin();
    const adminUserId = "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33";

    // Read current entry from Supabase
    const { data: currentEntry } = await supabase
      .from("routine_entries")
      .select("completed_labels, item_count")
      .eq("user_id", adminUserId)
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

    // Upsert to Supabase Postgres routine_entries
    const { error: upsertErr } = await supabase.from("routine_entries").upsert({
      user_id: adminUserId,
      night: targetNight,
      completed_labels: completedList,
      item_count: 4,
    }, { onConflict: "user_id,night" });

    if (upsertErr) {
      throw new Error(upsertErr.message);
    }

    return NextResponse.json({
      ok: true,
      message: isCompleted ? `Đã hoàn thành bước: ${label}` : `Đã bỏ tích: ${label}`,
      night: targetNight,
      completedLabels: completedList,
      completedCount: completedList.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật Supabase thất bại" }, { status: 500 });
  }
}
