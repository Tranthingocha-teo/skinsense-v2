import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  type RoutineStep,
  type RoleRoutine,
  EMPTY_ROLE_ROUTINES,
} from "@/lib/role-routines";
import { requireRoleActor } from "@/lib/session-auth";
import { downloadStorageJson, uploadStorageJson } from "@/lib/supabase/storage-json";
import { listAllUsers } from "@/lib/admin-approvals";

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
      return NextResponse.json({ ok: false, error: "Vai trò không hợp lệ." }, { status: 400 });
    }
    const target = typeof targetUser === "string" ? targetUser.trim().toLowerCase() : "";
    if (!target) {
      return NextResponse.json({ ok: false, error: "Vui lòng nhập email tài khoản nhận phác đồ." }, { status: 400 });
    }

    // The recipient must be a real account. An unknown email used to fall back to the super
    // admin's own account (a hard-coded id), overwriting her routine and still answering "ok".
    const supabase = getSupabaseAdmin();
    const byId = /^[0-9a-f-]{36}$/.test(target) ? (await supabase.auth.admin.getUserById(target)).data?.user : null;
    const recipient = byId ?? (await listAllUsers(supabase)).find((u) => u.email?.toLowerCase() === target);
    if (!recipient) {
      return NextResponse.json({ ok: false, error: `Không tìm thấy tài khoản ${targetUser.trim()}.` }, { status: 404 });
    }
    const targetUserId = recipient.id;

    // Built aside and kept only once everything is stored, so a failed allocation leaves this
    // instance serving the routine that is really saved.
    const nextRoutine: RoleRoutine = {
      ...ROUTINES_STORE[role],
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      targetUser: recipient.email ?? targetUserId,
      ...(Array.isArray(steps) ? { steps } : {}),
      allocatedBy: auth.actor.fullName,
    };

    // Sync to Supabase routine_items for the recipient; every failure is reported, not logged.
    if (Array.isArray(steps)) {
      const { data: previousRows, error: readError } = await supabase
        .from("routine_items")
        .select("user_id, label, position")
        .eq("user_id", targetUserId);
      if (readError) throw new Error(`Không đọc được routine_items: ${readError.message}`);
      const { error: deleteError } = await supabase.from("routine_items").delete().eq("user_id", targetUserId);
      if (deleteError) throw new Error(`Không cập nhật được routine_items: ${deleteError.message}`);
      const rows = steps.map((step: { label?: string; productName?: string }, i: number) => ({
        user_id: targetUserId,
        label: step.label || step.productName || `Bước ${i + 1}`,
        position: i,
      }));
      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("routine_items").insert(rows);
        if (insertError) {
          // Put the recipient's previous routine back rather than leave them with none.
          if (previousRows?.length) await supabase.from("routine_items").insert(previousRows);
          throw new Error(`Không lưu được routine_items: ${insertError.message}`);
        }
      }

      const userProtocol = {
        userId: targetUserId,
        targetUser: recipient.email ?? targetUserId,
        allocatedBy: auth.actor.fullName,
        routineTitle: nextRoutine.title,
        doctorNotes: nextRoutine.description,
        products: steps,
      };
      if (!(await uploadStorageJson(`routines/protocol_${targetUserId}.json`, userProtocol, supabase))) {
        throw new Error("Không lưu được phác đồ của tài khoản, vui lòng thử lại.");
      }
    }

    const nextStore = { ...ROUTINES_STORE, [role]: nextRoutine };
    if (!(await uploadStorageJson(ROLE_ROUTINES_STORAGE_PATH, nextStore, supabase))) {
      throw new Error("Không lưu được routine theo vai trò, vui lòng thử lại.");
    }
    ROUTINES_STORE[role] = nextRoutine;

    return NextResponse.json({
      ok: true,
      message: `Đã phân bổ Routine cho ${recipient.email ?? targetUserId}.`,
      routine: nextRoutine,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Phân bổ routine thất bại" }, { status: 500 });
  }
}
