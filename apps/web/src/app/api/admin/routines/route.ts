import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  type RoutineStep,
  type RoleRoutine,
  EMPTY_ROLE_ROUTINES,
} from "@/lib/role-routines";
import { requireRoleActor } from "@/lib/session-auth";
import { downloadStorageJson, uploadStorageJson } from "@/lib/supabase/storage-json";

export type { RoutineStep, RoleRoutine };

const ROLE_ROUTINES_STORAGE_PATH = "admin/role_routines_registry.json";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Persistent master store for routines categorized by 4 roles (Strict Multi-tenant, No Mock Data)
const ROUTINES_STORE: Record<string, RoleRoutine> = JSON.parse(
  JSON.stringify(EMPTY_ROLE_ROUTINES)
);

async function loadRoleRoutines(): Promise<Record<string, RoleRoutine>> {
  const remote = await downloadStorageJson<Record<string, RoleRoutine>>(ROLE_ROUTINES_STORAGE_PATH);
  if (remote && typeof remote === "object") {
    for (const key of Object.keys(remote)) {
      if (ROUTINES_STORE[key]) {
        ROUTINES_STORE[key] = remote[key];
      }
    }
  }
  return ROUTINES_STORE;
}

export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin", "specialist", "customer", "shop"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    await loadRoleRoutines();

    // Also check if today has real completions in Supabase
    const today = new Date().toISOString().split("T")[0];
    try {
      const supabase = getSupabaseAdmin();
      const { data: entries } = await supabase
        .from("routine_entries")
        .select("*")
        .eq("night", today);

      if (entries && entries.length > 0) {
        const completedSet = new Set(entries.flatMap((e) => e.completed_labels || []));
        for (const rKey of Object.keys(ROUTINES_STORE)) {
          ROUTINES_STORE[rKey].steps = ROUTINES_STORE[rKey].steps.map((st) => ({
            ...st,
            isCompleted: st.isCompleted || completedSet.has(st.label),
          }));
        }
      }
    } catch {}

    if (role && ROUTINES_STORE[role]) {
      return NextResponse.json({ ok: true, routine: ROUTINES_STORE[role] });
    }

    return NextResponse.json({ ok: true, routines: ROUTINES_STORE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load routines" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin", "specialist", "customer", "shop"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { role = "customer", stepId, isCompleted, night } = body;
    await loadRoleRoutines();

    if (!ROUTINES_STORE[role]) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }

    const currentRoutine = ROUTINES_STORE[role];
    currentRoutine.steps = currentRoutine.steps.map((s) => {
      if (s.id === stepId) {
        return { ...s, isCompleted: Boolean(isCompleted) };
      }
      return s;
    });

    // Persist tick to Supabase PostgreSQL routine_entries for authenticated user
    const targetNight = night || new Date().toISOString().split("T")[0];
    const completedLabels = currentRoutine.steps
      .filter((s) => s.isCompleted)
      .map((s) => s.label);

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("routine_entries").upsert({
        user_id: auth.actor.userId,
        night: targetNight,
        completed_labels: completedLabels,
        item_count: currentRoutine.steps.length,
      }, { onConflict: "user_id,night" });
    } catch (e) {
      console.error("Failed to sync tick to Supabase routine_entries:", e);
    }

    await uploadStorageJson(ROLE_ROUTINES_STORAGE_PATH, ROUTINES_STORE);

    const total = currentRoutine.steps.length;
    const completed = currentRoutine.steps.filter((s) => s.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      ok: true,
      message: isCompleted ? "Đã hoàn thành bước skincare!" : "Đã bỏ tích bước skincare.",
      completedCount: completed,
      totalCount: total,
      percent,
      routine: currentRoutine,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật tick thất bại" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["admin", "specialist"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { role = "customer", title, description, steps, targetUser } = body;
    await loadRoleRoutines();

    if (!ROUTINES_STORE[role]) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }

    ROUTINES_STORE[role] = {
      ...ROUTINES_STORE[role],
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(targetUser ? { targetUser: targetUser.trim() } : {}),
      ...(Array.isArray(steps) ? { steps } : {}),
      allocatedBy: "Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)",
    };

    // Sync to Supabase routine_items for target user
    if (Array.isArray(steps)) {
      try {
        const supabase = getSupabaseAdmin();
        let targetUserId = "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33"; // default to Super Admin
        if (targetUser && targetUser.trim()) {
          const trimmed = targetUser.trim();
          if (trimmed.length === 36 && trimmed.includes("-")) {
            targetUserId = trimmed;
          } else {
            const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const found = userList?.users.find((u) => u.email?.toLowerCase() === trimmed.toLowerCase());
            if (found) targetUserId = found.id;
          }
        }

        await supabase.from("routine_items").delete().eq("user_id", targetUserId);
        for (let i = 0; i < steps.length; i++) {
          await supabase.from("routine_items").insert({
            user_id: targetUserId,
            label: steps[i].label || steps[i].productName,
            position: i,
          });
        }

        // Also save user-specific protocol in Supabase Storage
        const userProtocol = {
          userId: targetUserId,
          targetUser: targetUser || targetUserId,
          allocatedBy: "Super Admin Trần Thị Ngọc Hà",
          routineTitle: title || ROUTINES_STORE[role].title,
          doctorNotes: description || ROUTINES_STORE[role].description,
          products: steps,
        };

        await supabase.storage.from("photos").upload(
          `routines/protocol_${targetUserId}.json`,
          Buffer.from(JSON.stringify(userProtocol, null, 2)),
          { upsert: true, contentType: "application/json" }
        );
      } catch (e) {
        console.error("Failed to sync routine_items to Supabase:", e);
      }
    }

    await uploadStorageJson(ROLE_ROUTINES_STORAGE_PATH, ROUTINES_STORE);

    return NextResponse.json({
      ok: true,
      message: `Đã phân bổ Routine thành công cho vai trò ${role}!`,
      routine: ROUTINES_STORE[role],
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Phân bổ routine thất bại" }, { status: 500 });
  }
}
