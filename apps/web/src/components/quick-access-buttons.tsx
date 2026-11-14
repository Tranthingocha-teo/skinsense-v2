"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Store, Stethoscope, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const QUICK_ROLES = [
  {
    role: "admin",
    label: "Admin (Ngọc Hà)",
    name: "Trần Thị Ngọc Hà (Super Admin)",
    email: "hattn.23itb@vku.udn.vn",
    password: "adminPassword123@",
    icon: ShieldCheck,
    badge: "Super Admin",
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
  {
    role: "customer",
    label: "Khách hàng",
    name: "Khách hàng Soi da",
    email: "khachhang@gmail.com",
    password: "password123",
    icon: User,
    badge: "Người dùng",
  },
];

export function QuickAccessButtons() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  async function handleQuickEnter(acc: (typeof QUICK_ROLES)[0]) {
    setLoadingRole(acc.role);

    // If Admin role clicked, route directly to the Admin Dashboard
    if (acc.role === "admin") {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });
      } catch {}
      router.push("/admin");
      return;
    }

    // If Specialist (Bác sĩ Da liễu) role clicked, route directly to Specialist Portal
    if (acc.role === "specialist") {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });
      } catch {}
      router.push("/specialist");
      return;
    }

    // If Shop (Chủ Cửa hàng) role clicked, route directly to Shopee Shop Portal
    if (acc.role === "shop") {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });
      } catch {}
      router.push("/shop");
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
          const isAdmin = acc.role === "admin";

          return (
            <button
              key={acc.role}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickEnter(acc)}
              className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center shadow-xs backdrop-blur-xs transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                isAdmin
                  ? "border-purple-600/40 bg-purple-500/10 hover:border-purple-600 hover:bg-purple-500/15"
                  : "border-foreground/15 bg-card/80 hover:border-primary hover:bg-card hover:shadow-md"
              }`}
            >
              <div
                className={`flex size-9 items-center justify-center rounded-full transition ${
                  isAdmin
                    ? "bg-purple-600/20 text-purple-700 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white"
                    : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                }`}
              >
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
