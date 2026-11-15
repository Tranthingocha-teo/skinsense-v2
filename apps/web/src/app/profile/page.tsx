"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RoleProfileView, type RoleType } from "@/components/role-profile-view";
import { RefreshCw } from "lucide-react";

function ProfileRoutingInner() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as RoleType | null;
  const [currentRole, setCurrentRole] = useState<RoleType>(roleParam || "customer");
  const [loading, setLoading] = useState(!roleParam);

  useEffect(() => {
    if (roleParam) {
      setCurrentRole(roleParam);
      setLoading(false);
      return;
    }

    // Tự động nhận diện role của người dùng đang đăng nhập
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.role) {
          setCurrentRole(data.user.role as RoleType);
        } else {
          setCurrentRole("customer");
        }
      })
      .catch(() => {
        setCurrentRole("customer");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roleParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E8E5DE]">
        <RefreshCw className="size-7 animate-spin text-[#2D5A43]" />
      </div>
    );
  }

  return <RoleProfileView role={currentRole} />;
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#E8E5DE]">
          <RefreshCw className="size-7 animate-spin text-[#2D5A43]" />
        </div>
      }
    >
      <ProfileRoutingInner />
    </Suspense>
  );
}
