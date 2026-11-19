"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPrescribedRoutine, type PrescribedRoutineData } from "@/components/user-prescribed-routine";
import { LogoMark } from "@/components/site-header";
import { Home, Store, ArrowLeft, RefreshCw, Stethoscope, Clock, CheckCircle2 } from "lucide-react";
import { INITIAL_SHOPEE_PRODUCTS } from "@/app/shop/page";
import { prescribedRoutineFromCases, type CatalogProduct, type ClinicalCaseRecord } from "@/lib/prescribed-routine";

interface SubmittedCaseSummary {
  id: string;
  caseCode: string;
  submittedDate: string;
  status: string;
  symptoms: string;
  assignedDoctor: string;
  skinHealthScore?: number;
  rednessIndex?: number;
}

type RoutineState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "none"; submittedCases: SubmittedCaseSummary[] }
  | { kind: "prescribed"; routine: PrescribedRoutineData; submittedCases: SubmittedCaseSummary[] };

// The patient's own prescription from their shared clinical records. This page used to render a
// built-in sample prescription for every visitor, signed in or not.
function usePrescribedRoutine(): RoutineState {
  const [state, setState] = useState<RoutineState>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/patient/clinical-records?mine=1", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }).catch(() => null),
    ])
      .then(async ([recRes, prodRes]) => {
        if (recRes.status === 401) return { kind: "signed-out" } as const;
        const json = (await recRes.json()) as {
          cases?: Array<
            ClinicalCaseRecord & {
              caseCode?: string;
              submittedDate?: string;
              status?: string;
              assignedDoctor?: string;
              aiAnalysis?: { skinHealthScore?: number; rednessIndex?: number };
            }
          >;
        };
        const cases = Array.isArray(json.cases) ? json.cases : [];

        const catalog: CatalogProduct[] = INITIAL_SHOPEE_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          priceVnd: p.priceVnd,
          originalPriceVnd: p.originalPriceVnd,
        }));

        if (prodRes && prodRes.ok) {
          const prodJson = (await prodRes.json().catch(() => null)) as {
            ok?: boolean;
            products?: Array<{ id: string; name: string; price?: number; status?: string }>;
          } | null;
          if (prodJson?.ok && Array.isArray(prodJson.products)) {
            for (const ap of prodJson.products) {
              if (ap.status === "approved" && typeof ap.price === "number") {
                catalog.push({
                  id: ap.id,
                  name: ap.name,
                  priceVnd: ap.price,
                  originalPriceVnd: ap.price,
                });
              }
            }
          }
        }

        const submittedCases: SubmittedCaseSummary[] = cases.map((c, idx) => ({
          id: c.id || `case_${idx}`,
          caseCode: c.caseCode || `BA-${idx + 1}`,
          submittedDate: c.submittedDate || "",
          status: c.status || "pending_routine",
          symptoms: c.symptoms || "",
          assignedDoctor: c.assignedDoctor || "Bác sĩ chuyên khoa",
          skinHealthScore: c.aiAnalysis?.skinHealthScore,
          rednessIndex: c.aiAnalysis?.rednessIndex,
        }));

        const routine = prescribedRoutineFromCases(cases, catalog);
        return routine
          ? ({ kind: "prescribed", routine, submittedCases } satisfies RoutineState)
          : ({ kind: "none", submittedCases } satisfies RoutineState);
      })
      .catch((): RoutineState => ({ kind: "none", submittedCases: [] }))
      .then((next) => {
        if (!cancelled) setState(next);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export default function UserRoutinePage() {
  const state = usePrescribedRoutine();

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19]">
                  SkinSense
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Hồ Sơ Điều Trị & Phác Đồ Bác Sĩ Kê
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 py-1.5 text-xs font-bold text-[#C2410C] hover:bg-white transition"
            >
              <Store className="size-3.5" />
              <span>Xem Gian Hàng Shop</span>
            </Link>

            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 py-1.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
            >
              <Home className="size-3.5" />
              <span>Trang chủ (Soi da)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="size-8 flex items-center justify-center rounded-xl bg-white border border-[#D8D4CA] text-[#5C605C] hover:text-[#191B19] transition"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif text-[#191B19]">
                Phác Đồ Routine Dưỡng Da Của Bạn
              </h1>
              <p className="text-xs text-[#5C605C]">
                Đơn kê trực tiếp từ Bác sĩ Da liễu phụ trách ca khám của bạn
              </p>
            </div>
          </div>
        </div>

        {state.kind === "loading" && (
          <div className="flex justify-center py-16">
            <RefreshCw className="size-7 animate-spin text-[#2D5A43]" />
          </div>
        )}
        {state.kind === "prescribed" && <UserPrescribedRoutine routine={state.routine} />}
        {(state.kind === "none" || state.kind === "signed-out") && (
          <div className="max-w-xl mx-auto rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-8 text-center space-y-3">
            <div className="mx-auto size-12 rounded-2xl bg-[#2D5A43]/10 text-[#2D5A43] flex items-center justify-center">
              <Stethoscope className="size-6" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#191B19]">
              {state.kind === "signed-out" ? "Vui lòng đăng nhập để xem phác đồ" : "Chưa có phác đồ nào được kê"}
            </h2>
            <p className="text-sm text-[#5C605C]">
              {state.kind === "signed-out"
                ? "Phác đồ do bác sĩ kê chỉ hiển thị trong tài khoản của bạn."
                : "Gửi bệnh án soi da cho bác sĩ từ trang Hôm nay; phác đồ bác sĩ kê sẽ hiện ở đây."}
            </p>
            <Link
              href={state.kind === "signed-out" ? "/" : "/app"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D5A43] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              <Home className="size-4" />
              <span>{state.kind === "signed-out" ? "Về trang chủ" : "Về trang Hôm nay"}</span>
            </Link>
          </div>
        )}

        {(state.kind === "none" || state.kind === "prescribed") && state.submittedCases.length > 0 && (
          <section className="max-w-5xl mx-auto mt-6 rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[#D8D4CA]/70 pb-3">
              <h3 className="font-serif text-base font-bold text-[#191B19]">
                Hồ sơ bệnh án đã gửi Bác sĩ ({state.submittedCases.length})
              </h3>
              <span className="text-xs text-[#5C605C]">Cập nhật trực tiếp từ phòng khám</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {state.submittedCases.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-2xl border border-[#D8D4CA] bg-white p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#191B19]">
                      {sc.caseCode} {sc.submittedDate ? `• ${sc.submittedDate}` : ""}
                    </span>
                    {sc.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-[11px] font-bold text-[#191B19]">
                        <CheckCircle2 className="size-3 text-[#2D5A43]" />
                        Hoàn tất liệu trình
                      </span>
                    ) : sc.status === "in_treatment" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#2D5A43]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#2D5A43]">
                        <CheckCircle2 className="size-3" />
                        Đã có phác đồ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                        <Clock className="size-3" />
                        Đang chờ Bác sĩ duyệt
                      </span>
                    )}
                  </div>
                  <p className="text-[#5C605C] line-clamp-2">{sc.symptoms}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#5C605C] pt-1 border-t border-[#D8D4CA]/50">
                    <span>Phụ trách: <strong className="text-[#191B19]">{sc.assignedDoctor}</strong></span>
                    {typeof sc.skinHealthScore === "number" && (
                      <span>Điểm da: <strong className="text-[#2D5A43]">{sc.skinHealthScore}/100</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
