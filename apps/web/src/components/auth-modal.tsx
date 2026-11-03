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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/site-header";

export type UserRole = "customer" | "shop" | "specialist" | "admin";

const DEMO_ACCOUNTS = [
  {
    role: "customer" as UserRole,
    label: "Khách hàng",
    name: "Trần Thị Ngọc Hà",
    email: "khachhang@gmail.com",
    password: "password123",
    icon: User,
    desc: "Soi da AI, theo dõi mụn, đơn mua & routine",
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
    role: "specialist" as UserRole,
    label: "Bác sĩ Da liễu",
    name: "BS. CKI Nguyễn Mai Hoa",
    email: "bacsi.hoa@skinsense.vn",
    password: "password123",
    icon: Stethoscope,
    desc: "Kê phác đồ điều trị, tư vấn chuyên khoa",
  },
  {
    role: "admin" as UserRole,
    label: "Quản trị viên",
    name: "Ban Quản Trị Hệ Thống",
    email: "admin@skinsense.vn",
    password: "admin123456",
    icon: ShieldCheck,
    desc: "Quản lý tài khoản, phân quyền & duyệt shop",
  },
];

export function AuthModal({
  triggerLabel,
  triggerClassName,
  defaultTab = "sign-in",
}: {
  triggerLabel?: string;
  triggerClassName?: string;
  defaultTab?: "sign-in" | "register";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"sign-in" | "register">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register Form
  const [regRole, setRegRole] = useState<UserRole>("customer");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regShopName, setRegShopName] = useState("");
  const [regSpecialty, setRegSpecialty] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  function openWithTab(targetTab: "sign-in" | "register") {
    setTab(targetTab);
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  }

  function handleQuickFill(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setSignInEmail(acc.email);
    setSignInPassword(acc.password);
    setError(null);
    setSuccess(`Đã điền tài khoản: ${acc.label} (${acc.email})`);
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
          specialty: regSpecialty.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Đăng ký thất bại.");
      }

      // Automatically sign in with newly registered account
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setSuccess("Đăng ký thành công! Vui lòng chuyển sang tab Đăng nhập.");
        setTab("sign-in");
        setSignInEmail(email);
        setSignInPassword(password);
        setLoading(false);
        return;
      }

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

  return (
    <>
      <button
        type="button"
        onClick={() => openWithTab("sign-in")}
        className={
          triggerClassName ||
          "flex h-11 items-center justify-center gap-2 rounded-lg border border-foreground/50 px-5 text-[14px] font-medium transition hover:border-foreground hover:bg-foreground/5"
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
                  SKINSENSE AUTH
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 border-b border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("sign-in");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition ${
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
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                  tab === "register"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng ký tài khoản
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-5">
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
                        placeholder="ten@gmail.com"
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
                        className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
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
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
                  >
                    {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
                  </button>

                  {/* 1-Click Demo Accounts */}
                  <div className="mt-3 border-t border-border pt-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      <span className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Đăng nhập mẫu nhanh (1-Click Fill)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const IconComponent = acc.icon;
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => handleQuickFill(acc)}
                            className="flex flex-col items-start rounded-lg border border-border/70 bg-muted/20 p-2.5 text-left transition hover:border-primary/60 hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-1.5">
                              <IconComponent className="size-3.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground">
                                {acc.label}
                              </span>
                            </div>
                            <span className="mt-1 text-[11px] text-muted-foreground" numberOfLines={1}>
                              {acc.email}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER */}
              {tab === "register" && (
                <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                  {/* Role Selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bạn muốn đăng ký với tư cách:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {[
                        { id: "customer" as UserRole, label: "Khách hàng", icon: User },
                        { id: "shop" as UserRole, label: "Cửa hàng", icon: Store },
                        { id: "specialist" as UserRole, label: "Bác sĩ", icon: Stethoscope },
                        { id: "admin" as UserRole, label: "Admin", icon: ShieldCheck },
                      ].map((r) => {
                        const IconC = r.icon;
                        const isSelected = regRole === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRegRole(r.id)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-center transition ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <IconC className="size-4" />
                            <span className="text-[11px]">{r.label}</span>
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
                          placeholder="La Roche-Posay Official"
                          className="h-9.5 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  {regRole === "specialist" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Chuyên khoa / Đơn vị công tác
                      </label>
                      <div className="relative">
                        <Stethoscope className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={regSpecialty}
                          onChange={(e) => setRegSpecialty(e.target.value)}
                          placeholder="Da liễu & Điều trị mụn chuyên sâu"
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
                          placeholder="0988776655"
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
                          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
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
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
                  >
                    {loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản ngay"}
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
