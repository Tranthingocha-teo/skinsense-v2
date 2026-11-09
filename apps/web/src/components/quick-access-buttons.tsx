"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Store, Stethoscope, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const QUICK_ROLES = [
  {
    role: "customer",
    label: "Khách hàng",
    name: "Trần Thị Ngọc Hà",
    email: "khachhang@gmail.com",
    password: "password123",
    icon: User,
    badge: "Người dùng",
  },
  {
    role: "admin",
    label: "Quản trị viên",
    name: "Ban Quản Trị Hệ Thống",
    email: "admin@skinsense.vn",
    password: "admin123456",
    icon: ShieldCheck,
    badge: "Admin",
  },
  {
    role: "specialist",
    label: "Bác sĩ Da liễu",
    name: "BS. CKI Nguyễn Mai Hoa",
    email: "bacsi.hoa@skinsense.vn",
    password: "password123",
    icon: Stethoscope,
    badge: "Bác sĩ",
  },
  {
    role: "shop",
    label: "Chủ Cửa hàng",
    name: "La Roche-Posay Official",
    email: "shop.laroche@skinsense.vn",
    password: "password123",
    icon: Store,
    badge: "Cửa hàng",
  },
];

export function QuickAccessButtons() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  async function handleQuickEnter(acc: (typeof QUICK_ROLES)[0]) {
    setLoadingRole(acc.role);

    // If Admin role clicked, route directly to the Admin Dashboard
    if (acc.role === "admin") {
      router.push("/admin");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });

      if (error) {
        // Fallback to /demo so user is NEVER blocked
        router.push("/demo");
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      router.push("/demo");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-success animate-pulse" />
        <span className="text-[12px] font-medium tracking-wider uppercase text-muted-foreground">
          Nhấp vào là vào xem ngay (Không cần nhập tài khoản):
        </span>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
        {QUICK_ROLES.map((acc) => {
          const IconC = acc.icon;
          const isLoading = loadingRole === acc.role;

          return (
            <button
              key={acc.role}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickEnter(acc)}
              className="group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-foreground/15 bg-card/80 p-3 text-center shadow-xs backdrop-blur-xs transition hover:scale-[1.03] hover:border-primary hover:bg-card hover:shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <IconC className="size-4.5" />
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-semibold text-foreground group-hover:text-primary">
                  {acc.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isLoading ? "Đang vào..." : "Nhấp vào ngay →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
