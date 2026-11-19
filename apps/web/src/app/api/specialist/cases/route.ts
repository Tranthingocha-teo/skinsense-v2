import { ownImageUrl } from "@skinsense/domain";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireRoleActor } from "@/lib/session-auth";
import { downloadStorageJson, uploadStorageJson, withStoreLock } from "@/lib/supabase/storage-json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PrescribedProductPayload {
  id?: string;
  name?: string;
  productName?: string;
  label?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  activeIngredients?: string;
  stepTime?: string;
  stepNumber?: number;
  dosage?: string;
  usageGuide?: string;
}

interface StoredClinicalCase {
  id?: string;
  caseCode?: string;
  patientUserId?: string;
  patientEmail?: string;
  patientName?: string;
  status?: string;
  [key: string]: unknown;
}

const CASES_PATH = "clinical_records/cases_registry.json";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function downloadJsonFromStorage<T = unknown>(supabase: SupabaseClient, path: string): Promise<T | null> {
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

/**
 * The cases patients sent to a specialist (clinical_records/cases_registry.json, written by
 * /api/patient/clinical-records when the patient exports a record).
 *
 * This used to also turn every row of the `photos` table into a "case" with a 24-hour signed URL,
 * so any approved specialist saw every user's face photos, notes and redness readings without the
 * user ever sharing them, bypassing the owner-only RLS on photos.
 */
export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["specialist", "admin"]);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const cases = (await downloadJsonFromStorage<StoredClinicalCase[]>(supabase, CASES_PATH)) || [];
    return NextResponse.json({ ok: true, cases: Array.isArray(cases) ? cases : [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load real cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["specialist", "admin"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body = await request.json();
    const { userId, caseId, routineTitle, revisitDate, doctorNotes, products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Vui lòng chỉ định ít nhất 1 sản phẩm cho phác đồ." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const targetCaseId = caseId || userId;
    const prescribedBy = actor.fullName;

    // 1. Resolve the patient from a case the patient shared, and nothing else. There is no
    //    fallback: an unresolved patient used to get a hard-coded real account, whose routine was
    //    then deleted and replaced, and a bare `userId` let a specialist overwrite the routine of
    //    any account that never sent them a record.
    const existingCases = (await downloadJsonFromStorage<StoredClinicalCase[]>(supabase, CASES_PATH)) || [];
    const targetCase = existingCases.find((c) => c.id === targetCaseId || c.caseCode === targetCaseId);

    let patientUserId: string | null = null;
    if (targetCase?.patientUserId) {
      const { data } = await supabase.auth.admin.getUserById(targetCase.patientUserId);
      if (data?.user) patientUserId = data.user.id;
    }
    if (!patientUserId && targetCase?.patientEmail) {
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const email = targetCase.patientEmail.toLowerCase();
      patientUserId = userList?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    }
    if (!targetCase || !patientUserId) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản bệnh nhân của hồ sơ này, phác đồ chưa được gửi." },
        { status: 404 },
      );
    }

    const targetPatientEmail = targetCase.patientEmail || "";
    const targetPatientName = targetCase.patientName || "";
    const routine = {
      routineTitle: routineTitle || "Phác đồ Điều trị Chuyên khoa Da liễu",
      startDate: new Date().toISOString().split("T")[0],
      revisitDate: revisitDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      doctorNotes: doctorNotes || "Tuân thủ đều đặn mỗi sáng và tối theo chỉ dẫn.",
      prescribedBy,
      prescribedAt: new Date().toISOString(),
      products: (products as PrescribedProductPayload[]).map((p, idx: number) => ({
        id: p.id || `prod_${idx}`,
        name: p.name || p.productName || p.label,
        brand: p.brand || "Chỉ định chuyên khoa",
        category: p.category || "Dược mỹ phẩm điều trị",
        imageUrl: ownImageUrl(p.imageUrl) ?? "",
        activeIngredients: p.activeIngredients || "Hoạt chất phục hồi biểu bì",
        stepTime: p.stepTime || "both",
        stepNumber: p.stepNumber || idx + 1,
        dosage: p.dosage || "1 lượng vừa đủ",
        usageGuide: p.usageGuide || "Thoa đều và vỗ nhẹ 30s.",
      })),
    };

    // 2. Mark the shared case as in treatment with this routine: re-read under the store lock, so a
    //    record another patient sends meanwhile is not dropped by writing back a stale list.
    await withStoreLock(CASES_PATH, async () => {
      const fresh = await downloadStorageJson<StoredClinicalCase[]>(CASES_PATH, supabase);
      if (!Array.isArray(fresh)) throw new Error("Không đọc được danh sách bệnh án, vui lòng thử lại.");
      const updatedCases = fresh.map((c) =>
        c.id === targetCase.id ? { ...c, status: "in_treatment", currentRoutine: routine } : c,
      );
      if (!(await uploadStorageJson(CASES_PATH, updatedCases, supabase))) {
        throw new Error("Không lưu được phác đồ, vui lòng thử lại.");
      }
    });

    // 3. Determine target patient user IDs to update. The owner's three accounts share one
    //    prescription, but only when the patient really is one of them: matching by name copied
    //    any "Ngọc Hà"'s prescription into her accounts and wiped their routines.
    const OWNER_ALIAS_IDS = [
      "365d9ffb-0ee5-41d2-879c-37ef337fe262", // Thị Ngọc Hà Trần
      "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33", // Super Admin Trần Thị Ngọc Hà
      "c28e1e5f-5813-461e-a3d2-2bc5be1b9470", // Customer Trần Thị Ngọc Hà
    ];
    const targetUserIds = new Set<string>(
      OWNER_ALIAS_IDS.includes(patientUserId) ? OWNER_ALIAS_IDS : [patientUserId],
    );

    // 4. Insert into Supabase Postgres routine_items strictly FOR THIS PATIENT (and aliases)
    for (const uid of targetUserIds) {
      try {
        await supabase.from("routine_items").delete().eq("user_id", uid);
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          await supabase.from("routine_items").insert({
            user_id: uid,
            label: p.name || p.label || p.productName,
            position: i,
          });
        }
      } catch {}

      // 5. Save protocol strictly for THIS PATIENT in Supabase Storage
      try {
        const patientProtocol = {
          userId: uid,
          patientEmail: targetPatientEmail,
          patientName: targetPatientName,
          allocatedBy: prescribedBy,
          prescribedBy,
          routineTitle: routine.routineTitle,
          doctorNotes: routine.doctorNotes,
          revisitDate: routine.revisitDate,
          products,
        };

        await supabase.storage.from("photos").upload(
          `routines/protocol_${uid}.json`,
          Buffer.from(JSON.stringify(patientProtocol, null, 2)),
          { upsert: true, contentType: "application/json" }
        );
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      message: "Đã lưu và gửi phác đồ Routine cho bệnh nhân thành công trên Supabase!",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lưu phác đồ thất bại" }, { status: 500 });
  }
}

/** Updates a shared clinical case status (e.g. completing treatment lifecycle) under atomic store lock. */
export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["specialist", "admin"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body = (await request.json().catch(() => null)) as {
      caseId?: unknown;
      status?: unknown;
      clinicalSummary?: unknown;
    } | null;

    const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : "";
    const status = body?.status === "completed" || body?.status === "in_treatment" ? body.status : null;
    if (!caseId || !status) {
      return NextResponse.json({ ok: false, error: "Thiếu caseId hoặc trạng thái cập nhật không hợp lệ." }, { status: 400 });
    }

    const clinicalSummary = typeof body?.clinicalSummary === "string" ? body.clinicalSummary.trim() : "";
    const supabase = getSupabaseAdmin();
    let updatedCase: StoredClinicalCase | null = null;

    await withStoreLock(CASES_PATH, async () => {
      const fresh = await downloadStorageJson<StoredClinicalCase[]>(CASES_PATH, supabase);
      if (!Array.isArray(fresh)) throw new Error("Không đọc được danh sách bệnh án, vui lòng thử lại.");
      const target = fresh.find((c) => c.id === caseId || c.caseCode === caseId);
      if (!target) {
        return;
      }

      updatedCase = {
        ...target,
        status,
        ...(status === "completed"
          ? { completedAt: new Date().toISOString(), treatmentDay: "Đã hoàn tất liệu trình" }
          : {}),
        ...(clinicalSummary ? { clinicalSummary } : {}),
        updatedBy: actor.fullName,
      };

      const nextList = fresh.map((c) => (c.id === target.id ? updatedCase! : c));
      if (!(await uploadStorageJson(CASES_PATH, nextList, supabase))) {
        throw new Error("Không cập nhật được trạng thái bệnh án, vui lòng thử lại.");
      }
    });

    if (!updatedCase) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy hồ sơ bệnh án cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      case: updatedCase,
      message:
        status === "completed"
          ? "Đã đánh dấu hoàn tất liệu trình theo dõi cho bệnh án."
          : "Đã mở lại trạng thái đang điều trị cho bệnh án.",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Cập nhật trạng thái bệnh án thất bại" },
      { status: 500 },
    );
  }
}
