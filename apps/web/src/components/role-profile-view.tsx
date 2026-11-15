"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  ShieldCheck,
  Stethoscope,
  Store,
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  Award,
  Star,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Camera,
  Building,
  FileText,
  BadgeCheck,
  Edit3,
  X,
  XCircle,
  ShoppingBag,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

export type RoleType = "customer" | "specialist" | "shop" | "admin";

interface RoleConfig {
  role: RoleType;
  title: string;
  roleBadge: string;
  badgeClass: string;
  primaryColor: string;
  backHref: string;
  backLabel: string;
  portalHref: string;
  portalLabel: string;
  icon: typeof User;
}

const ROLE_SETTINGS: Record<RoleType, RoleConfig> = {
  customer: {
    role: "customer",
    title: "Hồ Sơ Người Dùng",
    roleBadge: "Khách Hàng Thân Thiết",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/shop",
    backLabel: "Cửa hàng Shopee",
    portalHref: "/user/routine",
    portalLabel: "Xem Phác Đồ Routine",
    icon: User,
  },
  specialist: {
    role: "specialist",
    title: "Hồ Sơ Bác Sĩ Chuyên Khoa",
    roleBadge: "Bác Sĩ CCHN Bộ Y Tế",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/specialist",
    backLabel: "Cổng Bác Sĩ",
    portalHref: "/specialist",
    portalLabel: "Vào Cổng Khám Bệnh",
    icon: Stethoscope,
  },
  shop: {
    role: "shop",
    title: "Hồ Sơ Cửa Hàng (Shop)",
    roleBadge: "Shopee Mall Flagship",
    badgeClass: "bg-[#C2410C]/10 text-[#C2410C] border-[#C2410C]/30",
    primaryColor: "#C2410C",
    backHref: "/shop",
    backLabel: "Kênh Bán Hàng",
    portalHref: "/shop",
    portalLabel: "Quản Lý Gian Hàng",
    icon: Store,
  },
  admin: {
    role: "admin",
    title: "Hồ Sơ Quản Trị Viên",
    roleBadge: "Super Admin Cấp Cao",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/admin",
    backLabel: "Admin Dashboard",
    portalHref: "/admin",
    portalLabel: "Vào Bảng Quản Trị",
    icon: ShieldCheck,
  },
};

interface UserOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: "pending" | "processing" | "delivering" | "delivered" | "cancelled";
  paymentMethod: "momo" | "cod" | "vietqr" | "card";
  paymentStatus: "unpaid" | "paid";
  shopName: string;
  brand: string;
  carrier: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant: string;
    image?: string;
  }>;
  paidAt?: string;
  createdAt: string;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return iso;
  }
}

const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  cerave: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  hyalu: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
  bioderma: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  effaclar: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  duo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  anthelios: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
};

function getDisplayProductImage(name: string, img?: string): string {
  if (img && img.startsWith("http")) return img;
  const n = (name || "").toLowerCase();
  for (const [k, url] of Object.entries(PRODUCT_IMAGE_FALLBACKS)) {
    if (n.includes(k)) return url;
  }
  return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80";
}

export function RoleProfileView({ role }: { role: RoleType }) {
  const cfg = ROLE_SETTINGS[role];

  // Tab cho Customer: "profile" (Hồ sơ) hoặc "orders" (Đơn mua)
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");

  // Trạng thái Chế độ xem nhãn (Label Mode) hay Chế độ chỉnh sửa (Edit Mode)
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Role Specific States
  // Customer
  const [custAddress, setCustAddress] = useState("");
  const [custSkinType, setCustSkinType] = useState("");
  const [custAllergies, setCustAllergies] = useState("");

  // Specialist
  const [specHospital, setSpecHospital] = useState("");
  const [specLicense, setSpecLicense] = useState("");
  const [specSpecialty, setSpecSpecialty] = useState("");
  const [specExpYears, setSpecExpYears] = useState("10");
  const [specBio, setSpecBio] = useState("");

  // Shop
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopLicense, setShopLicense] = useState("");
  const [shopCategory, setShopCategory] = useState("");

  // Orders State (Cho riêng Customer)
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("all");

  // Load Profile từ API
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile?role=${role}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.ok && data.user) {
        const u = data.user;
        setUserId(u.id || "");
        setFullName(u.fullName || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAvatarUrl(u.avatarUrl || "");

        if (role === "customer" && u.customer) {
          setCustAddress(u.customer.address || "");
          setCustSkinType(u.customer.skinType || "");
          setCustAllergies(u.customer.allergies || "");
        } else if (role === "specialist" && u.specialist) {
          setSpecHospital(u.specialist.hospital || "");
          setSpecLicense(u.specialist.licenseNumber || "");
          setSpecSpecialty(u.specialist.specialty || "");
          setSpecExpYears(String(u.specialist.experienceYears || 10));
          setSpecBio(u.specialist.bio || "");
        } else if (role === "shop" && u.shop) {
          setShopName(u.shop.shopName || "");
          setShopAddress(u.shop.address || "");
          setShopLicense(u.shop.license || "");
          setShopCategory(u.shop.category || "");
        }

        // Nếu là Customer thì tải luôn danh sách đơn hàng cho đúng user này
        if (role === "customer") {
          loadUserOrders(u.fullName || "Thùy Dung", u.phone || "0987654321");
        }
      }
    } catch {
      toast.error("Không thể tải thông tin hồ sơ.");
    } finally {
      setLoading(false);
    }
  }

  // Tải danh sách đơn hàng dành riêng cho user này
  async function loadUserOrders(name: string, userPhone: string) {
    try {
      setOrdersLoading(true);
      const res = await fetch(`/api/user/orders?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(userPhone)}&_t=${Date.now()}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.orders)) {
        setOrders(json.orders);
      }
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [role]);

  // Lưu thông tin trực tiếp vào CSDL Supabase
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        id: userId,
        email,
        role,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim(),
        phone: phone.trim(),
      };

      if (role === "customer") {
        payload.customer = {
          address: custAddress.trim(),
          skinType: custSkinType.trim(),
          allergies: custAllergies.trim(),
        };
      } else if (role === "specialist") {
        payload.specialist = {
          hospital: specHospital.trim(),
          licenseNumber: specLicense.trim(),
          specialty: specSpecialty.trim(),
          experienceYears: Number(specExpYears) || 5,
          bio: specBio.trim(),
        };
      } else if (role === "shop") {
        payload.shop = {
          shopName: shopName.trim(),
          address: shopAddress.trim(),
          license: shopLicense.trim(),
          category: shopCategory.trim(),
        };
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.ok) {
        toast.success(`Đã cập nhật hồ sơ thành công vào cơ sở dữ liệu!`);
        setIsEditing(false); // Quay về chế độ Label sau khi lưu
      } else {
        toast.error(result.error || "Lưu thất bại!");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  // Lọc danh sách đơn hàng theo trạng thái (kèm bộ lọc Đã Hủy)
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "pending") return (o.status === "pending" || o.paymentStatus === "unpaid") && o.status !== "cancelled";
    if (orderFilter === "delivering") return o.status === "delivering" || o.status === "processing";
    if (orderFilter === "delivered") return o.status === "delivered";
    if (orderFilter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* HEADER TƯƠNG ĐỒNG VỚI HỆ THỐNG SKINSENSE */}
      <header className="sticky top-0 z-30 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={cfg.backHref}
              className="flex size-9 items-center justify-center rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-[#5C605C] hover:border-[#191B19] hover:text-[#191B19] transition"
              title={`Quay lại ${cfg.backLabel}`}
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-[#191B19] leading-tight flex items-center gap-2">
                <span>{cfg.title}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.badgeClass}`}>
                  <BadgeCheck className="size-3" />
                  {cfg.roleBadge}
                </span>
              </h1>
              <p className="text-xs text-[#5C605C]">
                Quản lý thông tin định danh cá nhân & thiết lập tài khoản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === "profile" && (
              <>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 h-9 rounded-xl bg-[#2D5A43] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Chỉnh Sửa Hồ Sơ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      loadData();
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition cursor-pointer"
                  >
                    <X className="size-3.5" />
                    <span>Hủy Chỉnh Sửa</span>
                  </button>
                )}
              </>
            )}

            <Link
              href={cfg.portalHref}
              className="hidden sm:flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
            >
              <span>{cfg.portalLabel}</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* NẾU LÀ CUSTOMER: HIỆN 2 TAB ĐIỀU HƯỚNG "HỒ SƠ CÁ NHÂN" VÀ "ĐƠN MUA CỦA TÔI" */}
        {role === "customer" && (
          <div className="border-t border-[#D8D4CA]/70 bg-[#FAF8F5]/80 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl flex items-center gap-2 py-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                }`}
              >
                <User className="size-3.5" />
                <span>Thông Tin Cá Nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                }`}
              >
                <ShoppingBag className="size-3.5" />
                <span>Đơn Mua Của Tôi</span>
                <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  activeTab === "orders" ? "bg-white text-[#2D5A43]" : "bg-[#2D5A43]/15 text-[#2D5A43]"
                }`}>
                  {orders.length}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* THÂN TRANG */}
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 animate-spin text-[#2D5A43]" />
            <p className="text-xs font-semibold text-[#5C605C]">Đang tải hồ sơ từ Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================= */}
            {/* CỘT TRÁI: THẺ ĐẠI DIỆN HỒ SƠ & CHỈ SỐ HOẠT ĐỘNG (4 COLS)     */}
            {/* ============================================================= */}
            <div className="lg:col-span-4 space-y-6">
              {/* Thẻ Avatar & Định danh */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xs text-center relative overflow-hidden">
                <div className="relative mx-auto size-24 rounded-full border-2 border-[#D8D4CA] shadow-sm overflow-hidden bg-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-[#F6F4EF] text-[#5C605C]">
                      <cfg.icon className="size-10" />
                    </div>
                  )}
                </div>

                <h2 className="mt-3.5 text-lg font-bold text-[#191B19] leading-snug">
                  {fullName || "Người dùng"}
                </h2>
                <p className="text-xs text-[#5C605C] mt-0.5">{email}</p>

                <div className="mt-3 flex items-center justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${cfg.badgeClass}`}>
                    <cfg.icon className="size-3.5" />
                    <span>{cfg.roleBadge}</span>
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#D8D4CA]/60 flex items-center justify-between text-xs text-[#5C605C]">
                  <span>Trạng thái tài khoản:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Đang hoạt động
                  </span>
                </div>
              </div>

              {/* Thẻ Chỉ số hoạt động riêng cho Role */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C605C] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#2D5A43]" />
                  <span>Chỉ số hoạt động</span>
                </h3>

                {role === "customer" && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#191B19]">{orders.length}</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Đơn hàng của bạn</div>
                    </div>
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#2D5A43]">12 ngày</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Routine duy trì</div>
                    </div>
                  </div>
                )}

                {role === "specialist" && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#2D5A43]">890</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Ca lâm sàng</div>
                    </div>
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-amber-600 flex items-center justify-center gap-1">
                        <span>5.0</span>
                        <Star className="size-3.5 fill-current" />
                      </div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">142 đánh giá</div>
                    </div>
                  </div>
                )}

                {role === "shop" && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#C2410C]">45</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Sản phẩm đăng bán</div>
                    </div>
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#2D5A43]">12.850+</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Đã bán thành công</div>
                    </div>
                  </div>
                )}

                {role === "admin" && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-[#2D5A43]">4 / 4</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">Phân hệ Quản trị</div>
                    </div>
                    <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                      <div className="text-xl font-bold text-emerald-700">100%</div>
                      <div className="text-[11px] text-[#5C605C] mt-0.5">An toàn hệ thống</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================= */}
            {/* CỘT PHẢI: TAB HỒ SƠ HOẶC TAB DANH SÁCH ĐƠN HÀNG (8 COLS)       */}
            {/* ============================================================= */}
            <div className="lg:col-span-8">
              {/* =========================================================== */}
              {/* NẾU ĐANG CHỌN TAB "ĐƠN MUA CỦA TÔI" (DÀNH CHO USER)         */}
              {/* =========================================================== */}
              {role === "customer" && activeTab === "orders" ? (
                <div className="space-y-4">
                  {/* THANH BỘ LỌC TRẠNG THÁI ĐƠN HÀNG CHUẨN SHOPEE */}
                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-2.5 shadow-xs flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {[
                        { key: "all", label: "Tất Cả" },
                        { key: "pending", label: "Chờ Thanh Toán" },
                        { key: "delivering", label: "Đang Vận Chuyển" },
                        { key: "delivered", label: "Đã Nhận Hàng" },
                        { key: "cancelled", label: "Đã Hủy" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderFilter(tab.key)}
                          className={`h-8 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            orderFilter === tab.key
                              ? "bg-[#2D5A43] text-white shadow-2xs"
                              : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => loadUserOrders(fullName, phone)}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg border border-[#D8D4CA] bg-white text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
                      title="Làm mới đơn hàng"
                    >
                      <RefreshCw className={`size-3 ${ordersLoading ? "animate-spin text-[#2D5A43]" : ""}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  {/* DANH SÁCH THẺ ĐƠN HÀNG (ORDER CARDS) */}
                  {ordersLoading ? (
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-12 text-center">
                      <RefreshCw className="size-6 animate-spin text-[#2D5A43] mx-auto" />
                      <p className="text-xs font-semibold text-[#5C605C] mt-2">Đang tải đơn hàng của bạn...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-12 text-center space-y-3">
                      <ShoppingBag className="size-12 text-[#D8D4CA] mx-auto stroke-1" />
                      <h4 className="text-sm font-bold text-[#191B19]">Chưa có đơn hàng nào</h4>
                      <p className="text-xs text-[#5C605C] max-w-sm mx-auto">
                        Bạn chưa có đơn hàng nào trong mục này. Hãy ghé qua cửa hàng Shopee Mall để chọn mua sản phẩm chăm sóc da nhé!
                      </p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#2D5A43] text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition"
                      >
                        <ShoppingBag className="size-3.5" />
                        <span>Mua Sắm Ngay</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const isPaid = order.paymentStatus === "paid";
                        const isCancelled = order.status === "cancelled";
                        const isPending = (order.status === "pending" || !isPaid) && !isCancelled;

                        // Tính thời gian còn lại trước khi đơn hàng hết hạn 3 ngày
                        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
                        const createdMs = new Date(order.createdAt).getTime();
                        const elapsedMs = Date.now() - createdMs;
                        const remainingHours = Math.max(1, Math.floor((THREE_DAYS_MS - elapsedMs) / (1000 * 60 * 60)));

                        return (
                          <div
                            key={order.id}
                            className={`rounded-2xl border overflow-hidden shadow-xs transition ${
                              isCancelled
                                ? "border-[#D8D4CA] bg-[#FAF8F5]/60 opacity-90"
                                : "border-[#D8D4CA] bg-[#FAF8F5] hover:border-[#2D5A43]/40"
                            }`}
                          >
                            {/* HEADER ĐƠN: TÊN SHOP & TRẠNG THÁI */}
                            <div className="border-b border-[#D8D4CA] bg-white px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-2 font-bold text-[#191B19]">
                                <Store className="size-3.5 text-[#C2410C]" />
                                <span>{order.shopName || "Gian Hàng Shopee Mall"}</span>
                                <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] text-white font-bold">
                                  Mall
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-[#5C605C]">
                                  {order.orderCode}
                                </span>
                                <span className="h-3 w-px bg-[#D8D4CA]" />
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                                    isPaid
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : isCancelled
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {isPaid ? (
                                    <>
                                      <CheckCircle2 className="size-3" />
                                      <span>✓ Đã Thanh Toán (MoMo)</span>
                                    </>
                                  ) : isCancelled ? (
                                    <>
                                      <XCircle className="size-3" />
                                      <span>Đã Hủy (Quá hạn 3 ngày)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="size-3 animate-pulse text-amber-600" />
                                      <span>Chờ Thanh Toán MoMo</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* DANH SÁCH MẶT HÀNG TRONG ĐƠN (CÓ ẢNH THẬT SẮC NÉT) */}
                            <div className="p-5 divide-y divide-[#D8D4CA]/50 space-y-3">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => {
                                  const itemImg = getDisplayProductImage(item.name, item.image);
                                  return (
                                    <div key={idx} className="flex items-start justify-between gap-3 pt-2 first:pt-0">
                                      <div className="flex items-center gap-3">
                                        {/* Ảnh sản phẩm thật sắc nét */}
                                        <div className="relative size-14 rounded-xl overflow-hidden border border-[#D8D4CA] bg-white shrink-0 shadow-2xs">
                                          <img
                                            src={itemImg}
                                            alt={item.name}
                                            className="size-full object-cover transition-transform duration-300 hover:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).src =
                                                "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80";
                                            }}
                                          />
                                        </div>
                                      <div>
                                        <h5 className="text-xs font-bold text-[#191B19] line-clamp-1">
                                          {item.name}
                                        </h5>
                                        <div className="text-[11px] text-[#5C605C] mt-0.5">
                                          Phân loại: <span className="font-medium text-[#191B19]">{item.variant || "Mặc định"}</span> | Số lượng: x{item.quantity}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-bold text-[#191B19]">
                                        {formatMoney(item.price * item.quantity)}
                                      </div>
                                      <div className="text-[10px] text-[#5C605C]">
                                        Đơn giá: {formatMoney(item.price)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                              ) : (
                                <div className="text-xs text-[#5C605C] py-2">
                                  Đơn hàng dược mỹ phẩm điều trị da chuyên sâu
                                </div>
                              )}
                            </div>

                            {/* CẢNH BÁO QUÁ HẠN 3 NGÀY HOẶC ĐÃ HỦY */}
                            {isPending && (
                              <div className="mx-5 mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-medium text-amber-900 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-4 text-amber-600 animate-pulse shrink-0" />
                                  <span>
                                    Hạn thanh toán: còn <strong>{remainingHours} giờ</strong>
                                  </span>
                                </div>
                                <span className="text-[11px] text-amber-700/90 hidden sm:inline">
                                  (Đơn sẽ tự động hủy nếu quá 3 ngày chưa thanh toán)
                                </span>
                              </div>
                            )}

                            {isCancelled && (
                              <div className="mx-5 mb-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-medium text-rose-900 flex items-center gap-2">
                                <XCircle className="size-4 text-rose-600 shrink-0" />
                                <span>
                                  Đơn hàng này đã <strong>tự động hủy</strong> do quá thời hạn 3 ngày chưa quét thanh toán MoMo.
                                </span>
                              </div>
                            )}

                            {/* FOOTER ĐƠN: ĐƠN VỊ VẬN CHUYỂN, TỔNG TIỀN & NÚT THAO TÁC */}
                            <div className="border-t border-[#D8D4CA] bg-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                              <div className="text-xs text-[#5C605C] flex items-center gap-2">
                                <Truck className="size-3.5 text-[#2D5A43]" />
                                <span>{order.carrier || "Shopee Express"}</span>
                                <span className="text-[11px] text-[#9CA3AF]">•</span>
                                <span className="text-[11px] text-[#5C605C]">{formatDate(order.createdAt)}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[11px] text-[#5C605C] mr-1.5">Thành tiền:</span>
                                  <strong className={`text-sm font-extrabold ${isCancelled ? "text-[#5C605C] line-through" : "text-[#C2410C]"}`}>
                                    {formatMoney(order.totalAmount)}
                                  </strong>
                                </div>

                                {isPending ? (
                                  <Link
                                    href={`/shop/checkout?orderCode=${order.orderCode}&amount=${order.totalAmount}`}
                                    className="flex items-center gap-1 h-8 px-3.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-2xs hover:bg-[#9A3412] transition"
                                  >
                                    <QrCode className="size-3" />
                                    <span>Thanh Toán Ngay</span>
                                  </Link>
                                ) : isCancelled ? (
                                  <Link
                                    href="/shop"
                                    className="flex items-center gap-1 h-8 px-3.5 rounded-xl border border-[#D8D4CA] bg-white text-xs font-bold text-[#191B19] hover:border-[#191B19] transition"
                                  >
                                    <span>Đặt Lại Đơn Mới</span>
                                  </Link>
                                ) : (
                                  <Link
                                    href="/shop"
                                    className="flex items-center gap-1 h-8 px-3.5 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-xs font-bold text-[#191B19] hover:bg-white transition"
                                  >
                                    <span>Mua Lại</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* =========================================================== */
                /* TAB HỒ SƠ THÔNG TIN (XEM NHÃN HOẶC FORM SỬA)                */
                /* =========================================================== */
                <div>
                  {!isEditing ? (
                    /* CHẾ ĐỘ 1: XEM DẠNG NHÃN (LABEL VIEW MODE - MẶC ĐỊNH) */
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 sm:p-7 shadow-xs space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4CA]">
                        <div>
                          <h3 className="text-base font-bold text-[#191B19]">
                            Thông Tin Chi Tiết Hồ Sơ
                          </h3>
                          <p className="text-xs text-[#5C605C] mt-0.5">
                            Dữ liệu lưu trữ chính xác trong cơ sở dữ liệu Supabase
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 h-8.5 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs font-bold text-[#191B19] hover:border-[#191B19] transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="size-3.5 text-[#2D5A43]" />
                          <span>Sửa</span>
                        </button>
                      </div>

                      {/* PHẦN 1: THÔNG TIN TÀI KHOẢN CHUNG */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          1. Thông tin chung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Họ tên */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Họ và tên hiển thị</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <User className="size-4 text-[#5C605C]" />
                              <span>{fullName || "Chưa cập nhật"}</span>
                            </p>
                          </div>

                          {/* Email */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ Email</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Mail className="size-4 text-[#5C605C]" />
                                <span>{email}</span>
                              </span>
                              <span className="text-[10px] text-[#2D5A43] font-bold">✓ Xác thực</span>
                            </p>
                          </div>

                          {/* Số điện thoại */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Số điện thoại</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <Phone className="size-4 text-[#5C605C]" />
                              <span>{phone || "Chưa cập nhật"}</span>
                            </p>
                          </div>

                          {/* Vai trò */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Vai trò hệ thống</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <BadgeCheck className="size-4 text-[#2D5A43]" />
                              <span>{cfg.roleBadge}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PHẦN 2: THÔNG TIN RIÊNG TỪNG ROLE */}
                      <div className="space-y-3.5 pt-4 border-t border-[#D8D4CA]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          2. Thông tin chuyên biệt ({cfg.roleBadge})
                        </h4>

                        {/* Khách hàng */}
                        {role === "customer" && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ nhận hàng mặc định</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                <MapPin className="size-4 text-[#C2410C] shrink-0" />
                                <span>{custAddress || "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}</span>
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tình trạng / Loại da</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {custSkinType || "Da hỗn hợp thiên dầu, nhạy cảm vùng chữ T (Fitzpatrick III)"}
                                </p>
                              </div>
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tiền sử dị ứng mỹ phẩm</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {custAllergies || "Dị ứng cồn khô nồng độ cao và hương liệu (Fragrance)"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bác sĩ */}
                        {role === "specialist" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Bệnh viện / Cơ sở y tế công tác</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Building className="size-4 text-[#2D5A43]" />
                                  <span>{specHospital || "Bệnh viện Da Liễu Trung Ương"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Số Chứng chỉ hành nghề (CCHN)</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Award className="size-4 text-[#2D5A43]" />
                                  <span>{specLicense || "014289/BYT-CCHN"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Chuyên khoa phụ trách</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {specSpecialty || "Chuyên khoa Da liễu & Thẩm mỹ Da"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Số năm kinh nghiệm</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {specExpYears || "10"} năm kinh nghiệm
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Tiểu sử chuyên môn (Bio)</span>
                              <p className="text-xs font-medium text-[#191B19] mt-1.5 leading-relaxed">
                                {specBio || "Hơn 10 năm kinh nghiệm điều trị mụn trứng cá chuyên sâu, phục hồi hàng rào màng đáy da nhạy cảm và điều trị tăng sắc tố sau viêm."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Cửa hàng */}
                        {role === "shop" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tên gian hàng chính thức</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Store className="size-4 text-[#C2410C]" />
                                  <span>{shopName || "La Roche-Posay Official Flagship Store"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Mã số GPKD / CBMP</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <FileText className="size-4 text-[#5C605C]" />
                                  <span>{shopLicense || "GPKD-882910-HCM / CBMP-54321/22/CBMP-QLD"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ kho hàng & Trụ sở đăng ký</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                <MapPin className="size-4 text-[#C2410C] shrink-0" />
                                <span>{shopAddress || "Tầng 12, Tòa nhà Bitexco, Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP. HCM"}</span>
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Ngành hàng dược mỹ phẩm</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1">
                                {shopCategory || "Dược mỹ phẩm chăm sóc & phục hồi da chuẩn y khoa"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Admin */}
                        {role === "admin" && (
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-2">
                            <div className="text-xs font-bold text-[#191B19] flex items-center gap-2">
                              <ShieldCheck className="size-4 text-[#2D5A43]" />
                              <span>Đặc quyền Quản trị Toàn quyền (Super Admin)</span>
                            </div>
                            <p className="text-xs text-[#5C605C] leading-relaxed">
                              Toàn quyền kiểm soát cơ sở dữ liệu Supabase, kiểm duyệt phê duyệt tài khoản Bác sĩ, cấp phép gian hàng Shopee Mall và cấu hình luồng thanh toán.
                            </p>
                            <div className="pt-2 text-xs text-[#191B19] font-medium">
                              <strong>Đơn vị trực thuộc:</strong> Viện CNTT & Y tế Số VKU
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* CHẾ ĐỘ 2: FORM CHỈNH SỬA (EDIT MODE KHI BẤM NÚT SỬA) */
                    <form
                      onSubmit={handleSave}
                      className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 sm:p-7 shadow-xs space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4CA]">
                        <div>
                          <h3 className="text-base font-bold text-[#191B19]">
                            Chỉnh Sửa Hồ Sơ ({cfg.roleBadge})
                          </h3>
                          <p className="text-xs text-[#5C605C] mt-0.5">
                            Nhập các thông tin cần thay đổi và bấm Lưu để cập nhật vào Database
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-1.5 h-8.5 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs font-bold text-[#5C605C] hover:text-[#191B19] transition cursor-pointer"
                        >
                          <X className="size-3.5" />
                          <span>Hủy</span>
                        </button>
                      </div>

                      {/* THÔNG TIN CHUNG */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          1. Thông tin chung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Họ và tên hiển thị *</label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Email (Đã xác thực)</label>
                            <input
                              type="email"
                              value={email}
                              readOnly
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 text-sm text-[#5C605C] cursor-not-allowed select-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Số điện thoại liên hệ</label>
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="09xx xxx xxx"
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Link ảnh đại diện (Avatar URL)</label>
                            <input
                              type="url"
                              value={avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              placeholder="https://..."
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* THÔNG TIN RIÊNG TỪNG ROLE */}
                      <div className="space-y-4 pt-4 border-t border-[#D8D4CA]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          2. Thông tin chuyên biệt
                        </h4>

                        {/* Customer form */}
                        {role === "customer" && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Địa chỉ giao hàng mặc định</label>
                              <input
                                type="text"
                                value={custAddress}
                                onChange={(e) => setCustAddress(e.target.value)}
                                placeholder="Số nhà, đường, phường, quận..."
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Tình trạng / Loại da</label>
                                <input
                                  type="text"
                                  value={custSkinType}
                                  onChange={(e) => setCustSkinType(e.target.value)}
                                  placeholder="Da hỗn hợp thiên dầu..."
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Ghi chú tiền sử dị ứng</label>
                                <input
                                  type="text"
                                  value={custAllergies}
                                  onChange={(e) => setCustAllergies(e.target.value)}
                                  placeholder="Dị ứng cồn khô, hương liệu..."
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Specialist form */}
                        {role === "specialist" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Bệnh viện công tác</label>
                                <input
                                  type="text"
                                  value={specHospital}
                                  onChange={(e) => setSpecHospital(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Số CCHN Bộ Y Tế</label>
                                <input
                                  type="text"
                                  value={specLicense}
                                  onChange={(e) => setSpecLicense(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Chuyên khoa</label>
                                <input
                                  type="text"
                                  value={specSpecialty}
                                  onChange={(e) => setSpecSpecialty(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Số năm kinh nghiệm</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={specExpYears}
                                  onChange={(e) => setSpecExpYears(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Tiểu sử chuyên môn (Bio)</label>
                              <textarea
                                rows={3}
                                value={specBio}
                                onChange={(e) => setSpecBio(e.target.value)}
                                className="w-full rounded-xl border border-[#D8D4CA] bg-white p-3 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Shop form */}
                        {role === "shop" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Tên gian hàng</label>
                                <input
                                  type="text"
                                  value={shopName}
                                  onChange={(e) => setShopName(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Mã số GPKD / CBMP</label>
                                <input
                                  type="text"
                                  value={shopLicense}
                                  onChange={(e) => setShopLicense(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Địa chỉ kho hàng & Trụ sở</label>
                              <input
                                type="text"
                                value={shopAddress}
                                onChange={(e) => setShopAddress(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Ngành hàng dược mỹ phẩm</label>
                              <input
                                type="text"
                                value={shopCategory}
                                onChange={(e) => setShopCategory(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Admin form */}
                        {role === "admin" && (
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5 text-xs text-[#5C605C]">
                            Tài khoản Quản trị viên Cấp cao (Super Admin) đồng bộ trực tiếp từ phân quyền Root hệ thống.
                          </div>
                        )}
                      </div>

                      {/* NÚT THAO TÁC KHI SỬA */}
                      <div className="pt-4 border-t border-[#D8D4CA] flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="h-10 px-4 rounded-xl border border-[#D8D4CA] bg-white text-xs font-bold text-[#5C605C] hover:bg-[#F6F4EF] transition"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="h-10 px-5 rounded-xl bg-[#2D5A43] text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <>
                              <Save className="size-3.5" />
                              <span>Lưu Thay Đổi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
