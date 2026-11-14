"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Store,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Phone,
  FileCheck2,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/site-header";
import { GoogleOAuthButton } from "@/components/google-oauth-button";

export type UserRole = "customer" | "shop" | "specialist" | "admin";

export const DEMO_ACCOUNTS = [
  {
    role: "admin" as UserRole,
    label: "Super Admin (Ngọc Hà)",
    name: "Trần Thị Ngọc Hà (Super Admin)",
    email: "hattn.23itb@vku.udn.vn",
    password: "adminPassword123@",
    icon: ShieldCheck,
    desc: "Toàn quyền quản trị, duyệt Bác sĩ & Cửa hàng",
  },
  {
    role: "specialist" as UserRole,
    label: "Bác sĩ Da liễu (Đã duyệt)",
    name: "BS. CKI Nguyễn Mai Hoa",
    email: "bacsi.hoa@skinsense.vn",
    password: "password123",
    icon: Stethoscope,
    desc: "Kê phác đồ điều trị, tư vấn chuyên khoa",
    status: "active",
  },
  {
    role: "specialist" as UserRole,
    label: "Bác sĩ (Chờ duyệt)",
    name: "ThS. BS Trần Quốc Tuấn",
    email: "bacsi.tuan@skinsense.vn",
    password: "password123",
    icon: Stethoscope,
    desc: "Hồ sơ CCHN đang chờ Admin Ngọc Hà duyệt",
    status: "pending",
  },
  {
    role: "shop" as UserRole,
    label: "Chủ Cửa hàng",
    name: "La Roche-Posay Official",
    email: "shop.laroche@skinsense.vn",
    password: "password123",
    icon: Store,
    desc: "Kênh người bán, quản lý bài đăng & kho hàng",
  },
  {
    role: "customer" as UserRole,
    label: "Khách hàng",
    name: "Khách hàng Test",
    email: "khachhang@gmail.com",
    password: "password123",
    icon: User,
    desc: "Soi da AI, theo dõi mụn, đơn mua & routine",
  },
];

export function AuthModal({
  triggerLabel,
  triggerClassName,
  defaultTab = "sign-in",
}: {
  triggerLabel?: string;
  triggerClassName?: string;
  defaultTab?: "sign-in" | "register" | "doctor-approval";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"sign-in" | "register" | "doctor-approval">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // General Register Form
  const [regRole, setRegRole] = useState<UserRole>("customer");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regShopName, setRegShopName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Doctor Approval Form
  const [docName, setDocName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [docLicenseId, setDocLicenseId] = useState("");
  const [docHospital, setDocHospital] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("Da liễu & Điều trị mụn");
  const [docPassword, setDocPassword] = useState("");

  function openWithTab(targetTab: "sign-in" | "register" | "doctor-approval") {
    setTab(targetTab);
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  }

  async function handleQuickFill(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setSignInEmail(acc.email);
    setSignInPassword(acc.password);
    setError(null);
    setSuccess(`Đang vào với vai trò: ${acc.label}...`);

    if (acc.role === "admin") {
      setIsOpen(false);
      router.push("/admin");
      return;
    }

    if (acc.role === "specialist") {
      setIsOpen(false);
      if ("status" in acc && acc.status === "pending") {
        router.push("/specialist?status=pending");
      } else {
        router.push("/specialist");
      }
      return;
    }

    if (acc.role === "shop") {
      setIsOpen(false);
      router.push("/shop");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });

      if (signInError) {
        router.push("/demo");
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      router.push("/demo");
    }
  }

  async function handleSignIn(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = signInEmail.trim().toLowerCase();
    const password = signInPassword;

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    // Special handler for Super Admin email
    if (email === "hattn.23itb@vku.udn.vn") {
      setSuccess("Đăng nhập Super Admin thành công! Chuyển tới Bảng Quản Trị...");
      setTimeout(() => {
        router.push("/admin");
      }, 500);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(
          signInError.message === "Invalid login credentials"
            ? "Email hoặc mật khẩu không chính xác. Bạn có thể chọn tài khoản mẫu phía dưới để thử nghiệm."
            : signInError.message,
        );
      }

      const userEmail = data.user?.email?.trim().toLowerCase() || "";
      const role = data.user?.user_metadata?.role;
      const status = data.user?.user_metadata?.status;

      if (userEmail === "hattn.23itb@vku.udn.vn" || role === "admin") {
        router.push("/admin");
        return;
      }

      if (
        role === "specialist" ||
        userEmail === "bacsi.hoa@skinsense.vn" ||
        userEmail === "dr.ha@gmail.com" ||
        userEmail.includes("doctor") ||
        userEmail.includes("bacsi")
      ) {
        if (status === "pending") {
          router.push("/specialist?status=pending");
        } else {
          router.push("/specialist");
        }
        return;
      }

      if (role === "shop") {
        router.push("/shop");
        return;
      }

      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = regEmail.trim().toLowerCase();
    const password = regPassword;

    if (!regFullName.trim()) {
      setError("Vui lòng nhập Họ và tên.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ Email hợp lệ.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }
    if (password !== regConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (regRole === "shop" && !regShopName.trim()) {
      setError("Vui lòng nhập Tên Cửa Hàng / Shop Name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: regFullName.trim(),
          role: regRole,
          phoneNumber: regPhone.trim(),
          shopName: regShopName.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Đăng ký thất bại.");
      }

      if (regRole === "specialist") {
        setSuccess("Đã gửi yêu cầu đăng ký Bác sĩ tới Admin Trần Thị Ngọc Hà để xét duyệt!");
        setLoading(false);
        return;
      }

      // Automatically sign in
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      setSuccess("Tạo tài khoản và đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
      setLoading(false);
    }
  }

  async function handleDoctorApprovalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = docEmail.trim().toLowerCase();

    if (!docName.trim()) {
      setError("Vui lòng nhập Họ và tên Bác sĩ.");
      return;
    }
    if (!docLicenseId.trim()) {
      setError("Vui lòng nhập Số Chứng chỉ hành nghề (CCHN).");
      return;
    }
    if (!docHospital.trim()) {
      setError("Vui lòng nhập Bệnh viện / Cơ sở y tế công tác.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ Email liên hệ.");
      return;
    }
    if (docPassword.length < 6) {
      setError("Mật khẩu bảo mật phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: docPassword,
          fullName: docName.trim(),
          role: "specialist",
          phoneNumber: docPhone.trim(),
          specialty: docSpecialty.trim(),
          licenseId: docLicenseId.trim(),
          hospital: docHospital.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Gửi yêu cầu thất bại.");
      }

      setSuccess(
        "✅ Hồ sơ Bác sĩ đã được gửi thành công! Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn) sẽ xét duyệt Chứng chỉ hành nghề. Sau khi duyệt, bạn có thể đăng nhập vào cổng chuyên gia.",
      );
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi yêu cầu thất bại.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openWithTab(defaultTab)}
        className={
          triggerClassName ||
          "flex h-11 items-center justify-center gap-2 rounded-lg border border-foreground/50 px-5 text-[14px] font-medium transition hover:border-foreground hover:bg-foreground/5 cursor-pointer"
        }
      >
        {triggerLabel || "Đăng nhập / Đăng ký"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <LogoMark className="size-6 text-foreground" />
                <span className="font-display text-[15px] font-semibold tracking-wider text-foreground">
                  SKINSENSE AUTH & XÉT DUYỆT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 3 Tabs Switcher */}
            <div className="grid grid-cols-3 border-b border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("sign-in");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex h-10 items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  tab === "sign-in"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex h-10 items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  tab === "register"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng ký
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("doctor-approval");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex h-10 items-center justify-center gap-1 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  tab === "doctor-approval"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="size-3.5 hidden sm:inline" />
                <span>Bác sĩ gửi duyệt</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-5">
              {/* Google OAuth Login Card (Supabase Auth - 1 Click) */}
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5 text-primary" />
                    Đăng nhập bằng Gmail (Google / Supabase)
                  </span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground">
                  Tiếp tục qua Supabase OAuth — Không cần mật khẩu. Email{" "}
                  <strong className="text-foreground">hattn.23itb@vku.udn.vn</strong> tự động nhận quyền Admin.
                </p>
                <GoogleOAuthButton label="Tiếp tục bằng Gmail (Google OAuth)" />
              </div>

              {/* Alert Feedback */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div
                  role="status"
                  className="mb-4 flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3 text-xs leading-5 text-success"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* TAB 1: SIGN IN */}
              {tab === "sign-in" && (
                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                  <div className="relative my-1 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-card px-3 text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
                      hoặc đăng nhập với tài khoản & mật khẩu
                    </span>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="hattn.23itb@vku.udn.vn hoặc bacsi.hoa@skinsense.vn"
                        className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 size-4 text-muted-foreground" />
                      <input
                        type={showSignInPassword ? "text" : "password"}
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 w-full rounded-lg border border-border bg-background pr-10 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showSignInPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
                  </button>

                  {/* 1-Click Demo / Role Accounts */}
                  <div className="mt-2 border-t border-border pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <Sparkles className="size-3 text-primary" />
                        Đăng nhập mẫu theo vai trò (1 Chạm)
                      </span>
                      <span className="text-[10px] text-muted-foreground">Nhấp là vào xem ngay</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const IconComponent = acc.icon;
                        const isSuperAdmin = acc.email === "hattn.23itb@vku.udn.vn";
                        return (
                          <button
                            key={acc.email + acc.label}
                            type="button"
                            onClick={() => handleQuickFill(acc)}
                            className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition cursor-pointer ${
                              isSuperAdmin
                                ? "border-purple-600/40 bg-purple-500/10 hover:border-purple-600"
                                : "border-border/70 bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <IconComponent
                                  className={`size-3.5 ${isSuperAdmin ? "text-purple-600 dark:text-purple-400" : "text-primary"}`}
                                />
                                <span className="text-xs font-semibold text-foreground">
                                  {acc.label}
                                </span>
                              </div>
                              {isSuperAdmin && (
                                <span className="rounded bg-purple-600/20 px-1 py-0.2 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="mt-1 text-[11px] font-mono text-muted-foreground">
                              {acc.email}
                            </span>
                            <span className="text-[10px] text-muted-foreground/80 line-clamp-1">
                              {acc.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: GENERAL REGISTER (Customer / Shop) */}
              {tab === "register" && (
                <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bạn muốn đăng ký vai trò:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "customer" as UserRole, label: "Khách hàng (Soi da)", icon: User },
                        { id: "shop" as UserRole, label: "Cửa hàng mỹ phẩm", icon: Store },
                      ].map((r) => {
                        const IconC = r.icon;
                        const isSelected = regRole === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRegRole(r.id)}
                            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-center transition cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <IconC className="size-4" />
                            <span className="text-xs">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User className="absolute top-3 left-3 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {regRole === "shop" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Tên Cửa Hàng / Shop Name
                      </label>
                      <div className="relative">
                        <Store className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={regShopName}
                          onChange={(e) => setRegShopName(e.target.value)}
                          placeholder="La Roche-Posay Official Flagship"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="ten@gmail.com"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0988 776 655"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Mật khẩu (≥ 6 ký tự)
                      </label>
                      <div className="relative">
                        <Lock className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-9 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showRegPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản ngay"}
                  </button>
                </form>
              )}

              {/* TAB 3: DOCTOR APPROVAL REQUEST */}
              {tab === "doctor-approval" && (
                <form onSubmit={handleDoctorApprovalSubmit} className="flex flex-col gap-3.5">
                  <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3 text-xs text-foreground">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                      <Stethoscope className="size-4" />
                      <span>Quy trình xét duyệt Bác sĩ Chuyên khoa Da liễu</span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                      Bác sĩ gửi thông tin Chứng chỉ hành nghề (CCHN). Yêu cầu sẽ được gửi trực tiếp tới Super Admin{" "}
                      <strong className="text-foreground">Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)</strong> để đối soát và kích hoạt quyền truy cập kê phác đồ da.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Họ và tên Bác sĩ / Học vị *
                    </label>
                    <div className="relative">
                      <User className="absolute top-3 left-3 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="ThS. BS Trần Quốc Tuấn"
                        className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Số Chứng chỉ hành nghề (CCHN) *
                      </label>
                      <div className="relative">
                        <FileCheck2 className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={docLicenseId}
                          onChange={(e) => setDocLicenseId(e.target.value)}
                          placeholder="CCHN-008812/BYT"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Đơn vị / Bệnh viện công tác *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={docHospital}
                          onChange={(e) => setDocHospital(e.target.value)}
                          placeholder="Bệnh viện Da Liễu Trung Ương"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Chuyên khoa điều trị
                    </label>
                    <input
                      type="text"
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      placeholder="Trị mụn viêm, Phục hồi tổn thương da, Thẩm mỹ nội khoa"
                      className="h-9.5 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Email liên hệ (Gmail) *
                      </label>
                      <div className="relative">
                        <Mail className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={docEmail}
                          onChange={(e) => setDocEmail(e.target.value)}
                          placeholder="bacsi.tuan@gmail.com"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Số điện thoại liên hệ *
                      </label>
                      <div className="relative">
                        <Phone className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="tel"
                          required
                          value={docPhone}
                          onChange={(e) => setDocPhone(e.target.value)}
                          placeholder="0918 222 333"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Mật khẩu khởi tạo (≥ 6 ký tự) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={docPassword}
                        onChange={(e) => setDocPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    <Stethoscope className="size-4" />
                    <span>{loading ? "Đang gửi hồ sơ..." : "Gửi yêu cầu duyệt Bác sĩ"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
