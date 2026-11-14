"use client";

import Link from "next/link";
import { UserPrescribedRoutine } from "@/components/user-prescribed-routine";
import { LogoMark } from "@/components/site-header";
import { Home, Store, ArrowLeft } from "lucide-react";

export default function UserRoutinePage() {
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
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 py-1.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
            >
              <Home className="size-3.5" />
              <span>Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/"
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

        {/* User Prescribed Routine Standalone Component */}
        <UserPrescribedRoutine />
      </main>
    </div>
  );
}
