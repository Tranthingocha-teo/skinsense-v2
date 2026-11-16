import { ownImageUrl } from "@skinsense/domain";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRoleActor } from "@/lib/session-auth";
import { downloadStorageJson, updateStorageJsonList } from "@/lib/supabase/storage-json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CASES_PATH = "clinical_records/cases_registry.json";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface ClinicalRecordEntry extends Record<string, unknown> {
  id?: string;
  userId?: string;
  patientUserId?: string;
  patientEmail?: string;
}

export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["customer", "specialist", "admin"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const supabase = getSupabaseAdmin();
    const allCases = (await downloadStorageJson<ClinicalRecordEntry[]>(CASES_PATH, supabase)) || [];

    // ?mine=1: only the caller's own records whatever the role (the patient routine page), so a
    // specialist opening /user/routine does not get another patient's prescription.
    const mineOnly = new URL(request.url).searchParams.get("mine") === "1";
    const cases =
      actor.role === "customer" || mineOnly
        ? allCases.filter(
            (c) =>
              c.patientUserId === actor.userId ||
              c.userId === actor.userId ||
              (typeof c.patientEmail === "string" &&
                c.patientEmail.trim().toLowerCase() === actor.email),
          )
        : allCases;

    return NextResponse.json({ ok: true, cases });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi tải hồ sơ bệnh án" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["customer", "specialist", "admin"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body = await request.json();
    const {
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      phone,
      skinType,
      symptoms,
      allergies,
      skinPhotoUrl,
      rednessIndex,
      spotsCount,
      affectedZones,
      doctorId,
    } = body;

    if (!patientName || !symptoms) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ tên bệnh nhân và mô tả triệu chứng lâm sàng." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    const newCaseId = `case_${Date.now()}`;

    const resolvedPatientUserId =
      actor.role === "customer"
        ? actor.userId
        : body.patientUserId || body.userId || (patientEmail === "trandinhhai0936039127@gmail.com" ? "365d9ffb-0ee5-41d2-879c-37ef337fe262" : undefined);

    const resolvedPatientEmail =
      actor.role === "customer"
        ? actor.email
        : patientEmail?.trim() || "khachhang@gmail.com";

    const caseFields = {
      patientUserId: resolvedPatientUserId,
      patientName: patientName.trim(),
      patientEmail: resolvedPatientEmail,
      patientAge: Number(patientAge) || 21,
      patientGender: patientGender || "Nữ",
      phone: phone?.trim() || "0905 123 456",
      skinType: skinType || "Hỗn hợp thiên dầu",
      fitzpatrickScale: "Loại III (Châu Á)",
      submittedDate: new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      severity: (Number(rednessIndex) > 55 ? "severe" : Number(rednessIndex) > 30 ? "moderate" : "mild"),
      status: "pending_routine",
      treatmentDay: "Ngày 1/14",
      symptoms: symptoms.trim(),
      allergies: allergies?.trim() || "Không ghi nhận tiền sử dị ứng mỹ phẩm",
      skinPhotoUrl: ownImageUrl(skinPhotoUrl) ?? "",
      aiAnalysis: {
        skinHealthScore: Math.max(30, Math.min(95, 100 - (Number(rednessIndex) || 45))),
        rednessIndex: Number(rednessIndex) || 45,
        inflammatorySpots: Number(spotsCount) || 8,
        comedoneSpots: Math.round((Number(spotsCount) || 8) * 1.5),
        affectedZones: Array.isArray(affectedZones) && affectedZones.length ? affectedZones : ["Má trái", "Má phải", "Cằm"],
      },
      assignedDoctor: doctorId || "BS. CKI Nguyễn Mai Hoa",
      createdAt: new Date().toISOString(),
    };

    // Prepended in one atomic step: reading the registry, adding the case and uploading it back
    // separately dropped a record another patient sent at the same moment. The code is numbered
    // from the list it is added to.
    const newCase = await updateStorageJsonList<Record<string, unknown>, Record<string, unknown> & { caseCode: string }>(
      CASES_PATH,
      supabase,
      (list) => {
        const created = { id: newCaseId, caseCode: `BA-2026-${String(list.length + 1).padStart(4, "0")}`, ...caseFields };
        return { next: [created, ...list], result: created };
      },
    );
    const { caseCode } = newCase;

    return NextResponse.json({
      ok: true,
      caseId: newCaseId,
      caseCode,
      message: `Đã xuất và gửi bệnh án ${caseCode} thành công tới Bác sĩ chuyên khoa!`,
      caseData: newCase,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gửi bệnh án thất bại" },
      { status: 500 },
    );
  }
}
