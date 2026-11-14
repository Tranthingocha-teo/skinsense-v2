import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const cases = (await downloadJsonFromStorage(supabase, "clinical_records/cases_registry.json")) || [];
    return NextResponse.json({ ok: true, cases });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi tải hồ sơ bệnh án" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    // 1. Download existing cases registry from Supabase Storage with cache busting
    const existingCases = (await downloadJsonFromStorage<any[]>(supabase, "clinical_records/cases_registry.json")) || [];

    const newCaseId = `case_${Date.now()}`;
    const caseIndex = existingCases.length + 1;
    const caseCode = `BA-2026-${String(caseIndex).padStart(4, "0")}`;

    const newCase = {
      id: newCaseId,
      caseCode,
      patientName: patientName.trim(),
      patientEmail: patientEmail?.trim() || "khachhang@gmail.com",
      patientAge: Number(patientAge) || 21,
      patientGender: patientGender || "Nữ",
      phone: phone?.trim() || "0905 123 456",
      skinType: skinType || "Hỗn hợp thiên dầu",
      fitzpatrickScale: "Loại III (Châu Á)",
      submittedDate: new Date().toLocaleDateString("vi-VN"),
      severity: (Number(rednessIndex) > 55 ? "severe" : Number(rednessIndex) > 30 ? "moderate" : "mild"),
      status: "pending_routine",
      treatmentDay: "Ngày 1/14",
      symptoms: symptoms.trim(),
      allergies: allergies?.trim() || "Không ghi nhận tiền sử dị ứng mỹ phẩm",
      skinPhotoUrl: skinPhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
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

    const updatedCases = [newCase, ...existingCases];

    // 2. Save back to Supabase Storage as Buffer
    const { error: uploadErr } = await supabase.storage.from("photos").upload(
      "clinical_records/cases_registry.json",
      Buffer.from(JSON.stringify(updatedCases, null, 2)),
      { upsert: true, contentType: "application/json" },
    );

    if (uploadErr) {
      throw new Error(uploadErr.message);
    }

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
