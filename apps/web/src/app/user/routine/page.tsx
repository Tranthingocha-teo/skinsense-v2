"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPrescribedRoutine, type PrescribedRoutineData } from "@/components/user-prescribed-routine";
import { LogoMark } from "@/components/site-header";
import { Home, Store, ArrowLeft, RefreshCw, Stethoscope } from "lucide-react";
import { INITIAL_SHOPEE_PRODUCTS } from "@/app/shop/page";
import { prescribedRoutineFromCases, type ClinicalCaseRecord } from "@/lib/prescribed-routine";

type RoutineState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "none" }
  | { kind: "prescribed"; routine: PrescribedRoutineData };

// The patient's own prescription from their shared clinical records. This page used to render a
// built-in sample prescription for every visitor, signed in or not.
function usePrescribedRoutine(): RoutineState {
  const [state, setState] = useState<RoutineState>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/patient/clinical-records?mine=1", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return { kind: "signed-out" } as const;
        const json = (await res.json()) as { cases?: ClinicalCaseRecord[] };
        const routine = prescribedRoutineFromCases(Array.isArray(json.cases) ? json.cases : [], INITIAL_SHOPEE_PRODUCTS);
        return routine ? ({ kind: "prescribed", routine } as const) : ({ kind: "none" } as const);
      })
      .catch(() => ({ kind: "none" }) as const)
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
      </main>
    </div>
  );
}
