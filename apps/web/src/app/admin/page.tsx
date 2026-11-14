"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Store,
  Stethoscope,
  ShieldCheck,
  User,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Home,
  Check,
  Lock,
  Unlock,
  Trash2,
  Package,
  ShoppingBag,
  TrendingUp,
  Settings,
  Clock,
  ShieldAlert,
  Sliders,
  Truck,
  RotateCcw,
  Server,
  Activity,
  Sparkles,
  CalendarCheck,
  Sun,
  Moon,
  Send,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";
import {
  type RoutineStep,
  type RoleRoutine,
  DEFAULT_ROLE_ROUTINES,
} from "@/lib/role-routines";

export type { RoutineStep, RoleRoutine };

export type RoleType = "customer" | "shop" | "specialist" | "admin";
export type UserStatus = "active" | "pending" | "suspended";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  status: UserStatus;
  createdAt: string;
  avatarUrl?: string;
  shopDetails?: {
    shopName: string;
    license: string;
    category: string;
    address: string;
  };
  specialistDetails?: {
    hospital: string;
    licenseId: string;
    specialty: string;
  };
}

export interface ProductItem {
  id: string;
  name: string;
  shopName: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
  stock: number;
}

export interface OrderItem {
  id: string;
  customerName: string;
  shopName: string;
  totalAmount: number;
  commission: number; // 8% fee
  status: "completed" | "shipping" | "disputed" | "processing";
  createdAt: string;
  disputeReason?: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: "usr_001",
    name: "Trần Thị Ngọc Hà",
    email: "khachhang@gmail.com",
    phone: "0905 123 456",
    role: "customer",
    status: "active",
    createdAt: "2026-10-15",
  },
  {
    id: "usr_002",
    name: "Nguyễn Văn Đinh",
    email: "dinh.dev@gmail.com",
    phone: "0912 888 999",
    role: "customer",
    status: "active",
    createdAt: "2026-10-20",
  },
  {
    id: "usr_003",
    name: "La Roche-Posay Official Store",
    email: "shop.laroche@skinsense.vn",
    phone: "028 3822 5588",
    role: "shop",
    status: "active",
    createdAt: "2026-10-10",
    shopDetails: {
      shopName: "La Roche-Posay VN Flagship",
      license: "GPKD-882910-HCM",
      category: "Dược mỹ phẩm trị mụn & phục hồi da",
      address: "Quận 1, TP. Hồ Chí Minh",
    },
  },
  {
    id: "usr_004",
    name: "CeraVe Vietnam Distribution",
    email: "shop.cerave@skinsense.vn",
    phone: "024 3944 6677",
    role: "shop",
    status: "pending",
    createdAt: "2026-11-08",
    shopDetails: {
      shopName: "CeraVe Skincare Official",
      license: "GPKD-991204-HN",
      category: "Sữa rửa mặt & Phục hồi hàng rào ẩm",
      address: "Hoàn Kiếm, Hà Nội",
    },
  },
  {
    id: "usr_005",
    name: "Innisfree Natural Care",
    email: "shop.innisfree@skinsense.vn",
    phone: "0988 333 444",
    role: "shop",
    status: "pending",
    createdAt: "2026-11-09",
    shopDetails: {
      shopName: "Innisfree Beauty Hub",
      license: "GPKD-774411-DN",
      category: "Mỹ phẩm thiên nhiên đảo Jeju",
      address: "Hải Châu, Đà Nẵng",
    },
  },
  {
    id: "usr_006",
    name: "BS. CKI Nguyễn Mai Hoa",
    email: "bacsi.hoa@skinsense.vn",
    phone: "0934 567 890",
    role: "specialist",
    status: "active",
    createdAt: "2026-10-12",
    specialistDetails: {
      hospital: "Bệnh viện Da Liễu Trung Ương",
      licenseId: "CCHN-003419/BYT",
      specialty: "Da liễu thẩm mỹ & Trị mụn trứng cá",
    },
  },
  {
    id: "usr_007",
    name: "ThS. BS Trần Quốc Tuấn",
    email: "bacsi.tuan@skinsense.vn",
    phone: "0918 222 333",
    role: "specialist",
    status: "pending",
    createdAt: "2026-11-07",
    specialistDetails: {
      hospital: "Phòng khám Chuyên khoa Da liễu Sài Gòn",
      licenseId: "CCHN-008812/BYT",
      specialty: "Phục hồi da sau tổn thương & Corticoid",
    },
  },
  {
    id: "usr_010",
    name: "BS. Lê Thị Bích Thảo",
    email: "dr.thao.derma@gmail.com",
    phone: "0944 555 666",
    role: "specialist",
    status: "pending",
    createdAt: "2026-11-13",
    specialistDetails: {
      hospital: "Bệnh viện Da Liễu TP. Đà Nẵng",
      licenseId: "CCHN-005621/BYT",
      specialty: "Điều trị mụn nội khoa & Dị ứng da tiếp xúc",
    },
  },
  {
    id: "usr_admin_ha",
    name: "Trần Thị Ngọc Hà (Super Admin)",
    email: "hattn.23itb@vku.udn.vn",
    phone: "0905 123 456",
    role: "admin",
    status: "active",
    createdAt: "2026-09-01",
  },
  {
    id: "usr_009",
    name: "Ban Quản Trị Hệ Thống",
    email: "admin@skinsense.vn",
    phone: "028 9999 8888",
    role: "admin",
    status: "active",
    createdAt: "2026-09-01",
  },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod_01",
    name: "Kem dưỡng giảm mụn phục hồi La Roche-Posay Effaclar Duo+M 40ml",
    shopName: "La Roche-Posay VN Flagship",
    price: 495000,
    category: "Trị mụn & Phục hồi",
    status: "approved",
    submittedAt: "2026-11-01",
    stock: 150,
  },
  {
    id: "prod_02",
    name: "Sữa rửa mặt dưỡng ẩm chuyên sâu CeraVe Hydrating Cleanser 473ml",
    shopName: "CeraVe Skincare Official",
    price: 380000,
    category: "Làm sạch & Cân bằng pH",
    status: "pending",
    submittedAt: "2026-11-08",
    stock: 200,
  },
  {
    id: "prod_03",
    name: "Mặt nạ đất sét tro núi lửa Innisfree Super Volcanic Pore Clay 100ml",
    shopName: "Innisfree Beauty Hub",
    price: 290000,
    category: "Mặt nạ hút dầu & Se khít lỗ chân lông",
    status: "pending",
    submittedAt: "2026-11-09",
    stock: 80,
  },
  {
    id: "prod_04",
    name: "Serum chống oxy hóa phục hồi Vitamin C 15% Pure Active 30ml",
    shopName: "La Roche-Posay VN Flagship",
    price: 920000,
    category: "Chống lão hóa & Sáng da mờ thâm",
    status: "approved",
    submittedAt: "2026-10-25",
    stock: 65,
  },
];

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ORD-9821",
    customerName: "Trần Thị Ngọc Hà",
    shopName: "La Roche-Posay VN Flagship",
    totalAmount: 990000,
    commission: 79200,
    status: "completed",
    createdAt: "2026-11-06",
  },
  {
    id: "ORD-9822",
    customerName: "Nguyễn Văn Đinh",
    shopName: "La Roche-Posay VN Flagship",
    totalAmount: 495000,
    commission: 39600,
    status: "shipping",
    createdAt: "2026-11-08",
  },
  {
    id: "ORD-9823",
    customerName: "Lê Thị Bích Thảo",
    shopName: "CeraVe Skincare Official",
    totalAmount: 760000,
    commission: 60800,
    status: "disputed",
    disputeReason: "Giao sai dung tích chai (đặt 473ml giao 236ml)",
    createdAt: "2026-11-07",
  },
  {
    id: "ORD-9824",
    customerName: "Hoàng Minh Tuấn",
    shopName: "Innisfree Beauty Hub",
    totalAmount: 580000,
    commission: 46400,
    status: "processing",
    createdAt: "2026-11-09",
  },
];

const ROLE_CONFIG: Record<
  RoleType,
  { label: string; icon: typeof User; badgeClass: string; desc: string; iconWrap: string }
> = {
  customer: {
    label: "Khách hàng",
    icon: User,
    badgeClass: "bg-sky-600/10 text-sky-900 dark:text-sky-300 border-sky-700/25",
    iconWrap: "bg-sky-600/10 text-sky-800 dark:text-sky-300",
    desc: "Người dùng soi da & mua hàng",
  },
  shop: {
    label: "Chủ Cửa hàng",
    icon: Store,
    badgeClass: "bg-amber-700/10 text-amber-950 dark:text-amber-200 border-amber-800/30",
    iconWrap: "bg-amber-700/10 text-amber-900 dark:text-amber-300",
    desc: "Nhà cung cấp sản phẩm & mỹ phẩm",
  },
  specialist: {
    label: "Bác sĩ Da liễu",
    icon: Stethoscope,
    badgeClass: "bg-emerald-700/10 text-emerald-950 dark:text-emerald-200 border-emerald-800/30",
    iconWrap: "bg-emerald-700/10 text-emerald-900 dark:text-emerald-300",
    desc: "Chuyên gia tư vấn & phác đồ da",
  },
  admin: {
    label: "Quản trị viên",
    icon: ShieldCheck,
    badgeClass: "bg-purple-700/10 text-purple-950 dark:text-purple-200 border-purple-800/30",
    iconWrap: "bg-purple-700/10 text-purple-900 dark:text-purple-300",
    desc: "Toàn quyền quản trị & phân quyền",
  },
};

type AdminNavTab = "users" | "specialists" | "routines" | "products" | "orders" | "analytics" | "settings";

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState<AdminNavTab>("users");

  // State for Routines by Role (Real Data from Supabase & Admin API)
  const [routinesData, setRoutinesData] = useState<Record<string, RoleRoutine>>(DEFAULT_ROLE_ROUTINES);
  const [activeRoutineRole, setActiveRoutineRole] = useState<RoleType>("customer");
  const [isTickingStep, setIsTickingStep] = useState<string | null>(null);
  const [assignRoutineEmail, setAssignRoutineEmail] = useState("hattn.23itb@vku.udn.vn");
  const [isAllocatingRoutine, setIsAllocatingRoutine] = useState(false);

  // State for Users
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<RoleType | "all" | "pending">("all");

  // State for Products
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [productFilter, setProductFilter] = useState<"all" | "pending" | "approved">("all");

  // State for Specialists
  const [specialistFilter, setSpecialistFilter] = useState<"all" | "pending" | "active">("all");
  const [inspectingSpecialist, setInspectingSpecialist] = useState<SystemUser | null>(null);

  // State for Orders
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);

  // Platform Settings State
  const [commissionRate, setCommissionRate] = useState(8);
  const [autoApproveProducts, setAutoApproveProducts] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500000);

  // Modals State
  const [inspectingShop, setInspectingShop] = useState<SystemUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<RoleType>("customer");
  const [editingUserRole, setEditingUserRole] = useState<SystemUser | null>(null);
  const [targetRole, setTargetRole] = useState<RoleType>("customer");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRoleFilter === "pending") {
        if (u.status !== "pending") return false;
      } else if (selectedRoleFilter !== "all") {
        if (u.role !== selectedRoleFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = u.phone.includes(q);
        const matchShop = u.shopDetails?.shopName.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchShop;
      }
      return true;
    });
  }, [users, selectedRoleFilter, searchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (productFilter === "all") return products;
    return products.filter((p) => p.status === productFilter);
  }, [products, productFilter]);

  // Filtered Specialists
  const filteredSpecialists = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== "specialist") return false;
      if (specialistFilter !== "all" && u.status !== specialistFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.specialistDetails?.licenseId.toLowerCase().includes(q) ?? false) ||
          (u.specialistDetails?.hospital.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [users, specialistFilter, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === "completed" || o.status === "shipping")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommission = orders
      .filter((o) => o.status === "completed" || o.status === "shipping")
      .reduce((sum, o) => sum + o.commission, 0);
    const pendingProductsCount = products.filter((p) => p.status === "pending").length;
    const disputedOrdersCount = orders.filter((o) => o.status === "disputed").length;
    const pendingShopsCount = users.filter((u) => u.role === "shop" && u.status === "pending").length;
    const pendingSpecialistsCount = users.filter((u) => u.role === "specialist" && u.status === "pending").length;

    return {
      totalRevenue,
      totalCommission,
      pendingProductsCount,
      disputedOrdersCount,
      pendingShopsCount,
      pendingSpecialistsCount,
      totalUsers: users.length,
    };
  }, [orders, products, users]);

  // Load Real Data from Supabase Auth & Storage on mount
  useEffect(() => {
    // 1. Fetch real users from Supabase Auth
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.users) && json.users.length > 0) {
          setUsers(json.users);
        }
      })
      .catch((err) => console.error("Failed to load real users from Supabase:", err));

    // 2. Fetch persistent products
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.products)) {
          setProducts(json.products);
        }
      })
      .catch((err) => console.error("Failed to load products:", err));

    // 3. Fetch persistent orders
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.orders)) {
          setOrders(json.orders);
        }
      })
      .catch((err) => console.error("Failed to load orders:", err));

    // 4. Fetch persistent routines by role (Supabase backed)
    fetch("/api/admin/routines")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && json.routines) {
          setRoutinesData(json.routines);
        }
      })
      .catch((err) => console.error("Failed to load routines:", err));
  }, []);

  // Routine Actions: Ticking (Tích sau khi làm) & Allocating (Phân bổ)
  async function handleToggleRoutineStep(role: RoleType, step: RoutineStep) {
    setIsTickingStep(step.id);
    const newStatus = !step.isCompleted;

    // Optimistic state update
    setRoutinesData((prev) => {
      if (!prev[role]) return prev;
      const updatedSteps = prev[role].steps.map((s) =>
        s.id === step.id ? { ...s, isCompleted: newStatus } : s
      );
      return {
        ...prev,
        [role]: { ...prev[role], steps: updatedSteps },
      };
    });

    try {
      const res = await fetch("/api/admin/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          stepId: step.id,
          isCompleted: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message, {
          description: `Đã cập nhật: ${data.completedCount}/${data.totalCount} bước (${data.percent}%)`,
        });
        if (data.routine) {
          setRoutinesData((prev) => ({ ...prev, [role]: data.routine }));
        }
      } else {
        toast.error("Không thể lưu trạng thái tick: " + (data.error || "Lỗi hệ thống"));
      }
    } catch {
      toast.error("Lỗi kết nối khi lưu trạng thái tick");
    } finally {
      setIsTickingStep(null);
    }
  }

  async function handleAllocateRoutine(role: RoleType) {
    if (!assignRoutineEmail.trim()) {
      toast.error("Vui lòng nhập email người nhận phác đồ");
      return;
    }
    setIsAllocatingRoutine(true);
    try {
      const current = routinesData[role];
      const res = await fetch("/api/admin/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          targetUser: assignRoutineEmail.trim(),
          title: current?.title,
          description: current?.description,
          steps: current?.steps,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Đã phân bổ Routine ${role.toUpperCase()} thành công!`, {
          description: `Phác đồ đã được gán cho ${assignRoutineEmail} và đồng bộ bảng routine_items trên Supabase.`,
        });
        if (data.routine) {
          setRoutinesData((prev) => ({ ...prev, [role]: data.routine }));
        }
      } else {
        toast.error("Phân bổ thất bại: " + (data.error || "Lỗi không xác định"));
      }
    } catch {
      toast.error("Lỗi kết nối khi phân bổ routine");
    } finally {
      setIsAllocatingRoutine(false);
    }
  }

  // Actions
  function handleApproveSpecialist(id: string, name: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" } : u))
    );
    toast.success(`Đã phê duyệt CCHN & kích hoạt tài khoản Bác sĩ: "${name}"`);
    setInspectingSpecialist(null);

    fetch("/api/admin/specialists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, action: "approve" }),
    }).catch(() => {});
  }

  function handleRejectSpecialist(id: string, name: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "suspended" } : u))
    );
    toast.error(`Đã từ chối cấp phép hồ sơ Bác sĩ: "${name}"`);
    setInspectingSpecialist(null);

    fetch("/api/admin/specialists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, action: "reject" }),
    }).catch(() => {});
  }

  // Actions
  function handleApproveProduct(id: string, name: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
    toast.success(`Đã phê duyệt sản phẩm: "${name}"`);
    fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, status: "approved" }),
    }).catch(() => {});
  }

  function handleRejectProduct(id: string, name: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
    );
    toast.error(`Đã từ chối cấp phép cho sản phẩm: "${name}"`);
    fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, status: "rejected" }),
    }).catch(() => {});
  }

  function handleResolveDispute(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "completed", disputeReason: undefined } : o))
    );
    toast.success(`Đã xử lý khiếu nại đơn hàng ${id} và hoàn tất bồi hoàn cho khách.`);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, action: "resolve" }),
    }).catch(() => {});
  }

  function handleApproveShop(id: string, name: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" } : u))
    );
    toast.success(`Đã phê duyệt Cửa hàng: "${name}"`);
    setInspectingShop(null);
    fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, status: "active" }),
    }).catch(() => {});
  }

  function handleRejectShop(id: string, name: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "suspended" } : u))
    );
    toast.error(`Đã từ chối cấp phép Cửa hàng: "${name}".`);
    setInspectingShop(null);
    fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, status: "suspended" }),
    }).catch(() => {});
  }

  function handleToggleStatus(user: SystemUser) {
    const newStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    if (newStatus === "active") {
      toast.success(`Đã mở khóa tài khoản cho ${user.name}`);
    } else {
      toast.warning(`Đã tạm khóa tài khoản của ${user.name}`);
    }
    fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, status: newStatus }),
    }).catch(() => {});
  }

  function handleChangeRoleSubmit() {
    if (!editingUserRole) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUserRole.id ? { ...u, role: targetRole } : u))
    );
    toast.success(`Đã chuyển vai trò của "${editingUserRole.name}" thành: ${ROLE_CONFIG[targetRole].label}`);
    fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editingUserRole.id, role: targetRole }),
    }).catch(() => {});
    setEditingUserRole(null);
  }

  async function handleAddUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Vui lòng nhập họ tên và email hợp lệ.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          fullName: newUserName.trim(),
          phone: newUserPhone.trim(),
          role: newUserRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error(json.error || "Tạo tài khoản thất bại.");
        return;
      }

      const createdUser: SystemUser = {
        id: json.user?.id || `usr_${Date.now()}`,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim() || "0905 123 456",
        role: newUserRole,
        status: newUserRole === "specialist" ? "pending" : "active",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setUsers([createdUser, ...users]);
      toast.success(`Đã thêm tài khoản thực tế vào Supabase: ${createdUser.name} (${ROLE_CONFIG[createdUser.role].label})`);
      setIsAddUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserRole("customer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo tài khoản thất bại.");
    }
  }

  function handleDeleteUser(id: string, name: string) {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống Supabase?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`Đã xóa tài khoản "${name}" khỏi Supabase`);
      fetch(`/api/admin/users?userId=${id}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header - Rộng 1440px cân đối */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app" className="flex items-center gap-2.5 group" title="Về trang soi da (Hôm nay)">
              <LogoMark className="size-7 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-display text-sm tracking-[0.2em] uppercase font-bold text-foreground">
                  SkinSense
                </span>
                <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">
                  Cổng Quản Trị Hệ Thống Sàn
                </span>
              </div>
            </Link>

            <span className="h-5 w-px bg-border mx-2" />

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-700/10 text-purple-950 dark:text-purple-200 border border-purple-800/25">
                <ShieldCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Trần Thị Ngọc Hà (Admin: hattn.23itb@vku.udn.vn)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium border border-border bg-card hover:bg-surface-2 transition text-muted-foreground hover:text-foreground"
              title="Về trang soi da (Hôm nay)"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Trang soi da (Trang chủ)</span>
            </Link>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Thêm tài khoản</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar - Rộng 1440px cân đối */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xs px-4 sm:px-8 py-3">
        <div className="max-w-[1440px] w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-surface-2/70 border border-border gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCurrentTab("users")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "users"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Users className="size-4" />
              <span>Phân quyền 4 Role</span>
              {summaryMetrics.pendingShopsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-800 text-amber-50 font-bold">
                  {summaryMetrics.pendingShopsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("specialists")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "specialists"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Stethoscope className="size-4" />
              <span>Duyệt Bác sĩ Da liễu</span>
              {summaryMetrics.pendingSpecialistsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-emerald-50 font-bold animate-pulse">
                  {summaryMetrics.pendingSpecialistsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("routines")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "routines"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Phân Bổ Routine 4 Role</span>
            </button>

            <button
              onClick={() => setCurrentTab("products")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "products"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Package className="size-4" />
              <span>Duyệt Sản phẩm Shop</span>
              {summaryMetrics.pendingProductsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-800 text-amber-50 font-bold">
                  {summaryMetrics.pendingProductsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("orders")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "orders"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <ShoppingBag className="size-4" />
              <span>Đơn hàng & Khiếu nại</span>
              {summaryMetrics.disputedOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-800 text-rose-50 font-bold">
                  {summaryMetrics.disputedOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("analytics")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "analytics"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <TrendingUp className="size-4" />
              <span>Doanh thu & Hoa hồng</span>
            </button>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                currentTab === "settings"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Settings className="size-4" />
              <span>Cấu hình Sàn</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-700 dark:bg-emerald-400" />
            <span>Hệ thống trực tuyến · Sẵn sàng vận hành</span>
          </div>
        </div>
      </div>

      {/* Main Content Body - Khung to rộng 1440px giúp bảng không bị bóp nghẹt */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* TAB 1: PHÂN QUYỀN 4 ROLE (USERS & ROLES) */}
        {currentTab === "users" && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              <div
                onClick={() => setSelectedRoleFilter("customer")}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Khách hàng (User)</span>
                  <div className="size-9 rounded-xl bg-sky-600/10 text-sky-800 dark:text-sky-300 flex items-center justify-center">
                    <User className="size-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {users.filter((u) => u.role === "customer").length}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Soi da & mua sản phẩm</p>
                </div>
              </div>

              <div
                onClick={() => setSelectedRoleFilter("shop")}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Chủ Cửa hàng (Shop)</span>
                  <div className="size-9 rounded-xl bg-amber-700/10 text-amber-900 dark:text-amber-300 flex items-center justify-center">
                    <Store className="size-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {users.filter((u) => u.role === "shop").length}
                  </span>
                  {summaryMetrics.pendingShopsCount > 0 && (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-700/15 text-amber-950 dark:text-amber-200 border border-amber-800/30">
                      {summaryMetrics.pendingShopsCount} chờ duyệt
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Nhà cung cấp mỹ phẩm</p>
              </div>

              <div
                onClick={() => setSelectedRoleFilter("specialist")}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Bác sĩ Da liễu</span>
                  <div className="size-9 rounded-xl bg-emerald-700/10 text-emerald-900 dark:text-emerald-300 flex items-center justify-center">
                    <Stethoscope className="size-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {users.filter((u) => u.role === "specialist").length}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Tư vấn & kê phác đồ da</p>
                </div>
              </div>

              <div
                onClick={() => setSelectedRoleFilter("admin")}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Ban Quản trị (Admin)</span>
                  <div className="size-9 rounded-xl bg-purple-700/10 text-purple-900 dark:text-purple-300 flex items-center justify-center">
                    <ShieldCheck className="size-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {users.filter((u) => u.role === "admin").length}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Phân quyền & kiểm duyệt</p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedRoleFilter("all")}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedRoleFilter === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tất cả ({users.length})
                </button>
                <button
                  onClick={() => setSelectedRoleFilter("customer")}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedRoleFilter === "customer"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Khách hàng ({users.filter((u) => u.role === "customer").length})
                </button>
                <button
                  onClick={() => setSelectedRoleFilter("shop")}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedRoleFilter === "shop"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chủ Cửa hàng ({users.filter((u) => u.role === "shop").length})
                </button>
                <button
                  onClick={() => setSelectedRoleFilter("specialist")}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedRoleFilter === "specialist"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bác sĩ ({users.filter((u) => u.role === "specialist").length})
                </button>
                <button
                  onClick={() => setSelectedRoleFilter("admin")}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedRoleFilter === "admin"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Admin ({users.filter((u) => u.role === "admin").length})
                </button>
                <button
                  onClick={() => setSelectedRoleFilter("pending")}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedRoleFilter === "pending"
                      ? "bg-amber-800 text-amber-50 font-bold"
                      : "bg-amber-700/10 border border-amber-800/30 text-amber-950 dark:text-amber-200 hover:bg-amber-700/20"
                  }`}
                >
                  <span className="size-2 rounded-full bg-amber-800 dark:bg-amber-400" />
                  Cần duyệt ({summaryMetrics.pendingShopsCount})
                </button>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm tên, email, SĐT, cửa hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-[13px] rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* User Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border font-semibold">
                    <tr>
                      <th className="py-4 px-6 min-w-[240px] whitespace-nowrap">Tài khoản & Email</th>
                      <th className="py-4 px-6 min-w-[140px] whitespace-nowrap">Số điện thoại</th>
                      <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">Vai trò (Role)</th>
                      <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">Trạng thái</th>
                      <th className="py-4 px-6 min-w-[120px] whitespace-nowrap">Ngày tham gia</th>
                      <th className="py-4 px-6 min-w-[150px] text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => {
                      const roleMeta = ROLE_CONFIG[user.role];
                      const RoleIcon = roleMeta.icon;

                      return (
                        <tr key={user.id} className="hover:bg-surface-2/40 transition">
                          <td className="py-4.5 px-6">
                            <div className="flex items-center gap-3.5">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="size-9 rounded-full object-cover shrink-0 border border-border"
                                />
                              ) : (
                                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-sm">
                                  {user.name}
                                </span>
                                <span className="text-muted-foreground text-xs mt-0.5">
                                  {user.email}
                                </span>
                                {user.shopDetails && (
                                  <span className="text-[11px] text-amber-900 dark:text-amber-300 font-medium mt-1 flex items-center gap-1.5">
                                    <Store className="size-3" />
                                    {user.shopDetails.shopName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4.5 px-6 text-muted-foreground font-mono text-xs whitespace-nowrap">
                            {user.phone}
                          </td>

                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleMeta.badgeClass}`}
                            >
                              <RoleIcon className="size-3.5" />
                              {roleMeta.label}
                            </span>
                          </td>

                          <td className="py-4.5 px-6 whitespace-nowrap">
                            {user.status === "active" && (
                              <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                <CheckCircle2 className="size-4" />
                                Đang hoạt động
                              </span>
                            )}
                            {user.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-xs font-bold">
                                <AlertTriangle className="size-4" />
                                Chờ duyệt
                              </span>
                            )}
                            {user.status === "suspended" && (
                              <span className="inline-flex items-center gap-1.5 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                                <XCircle className="size-4" />
                                Đã tạm khóa
                              </span>
                            )}
                          </td>

                          <td className="py-4.5 px-6 text-muted-foreground text-xs whitespace-nowrap">
                            {user.createdAt}
                          </td>

                          <td className="py-4.5 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {user.role === "shop" && user.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => setInspectingShop(user)}
                                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-700/15 text-amber-950 dark:text-amber-200 hover:bg-amber-700/25 border border-amber-800/30 transition cursor-pointer"
                                  >
                                    Xem hồ sơ shop
                                  </button>
                                  <button
                                    onClick={() => handleApproveShop(user.id, user.name)}
                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="size-3.5" />
                                    Duyệt
                                  </button>
                                </>
                              ) : user.role === "specialist" && user.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => setInspectingSpecialist(user)}
                                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-700/15 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-700/25 border border-emerald-800/30 transition cursor-pointer"
                                  >
                                    Xem CCHN
                                  </button>
                                  <button
                                    onClick={() => handleApproveSpecialist(user.id, user.name)}
                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="size-3.5" />
                                    Duyệt Bác sĩ
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUserRole(user);
                                      setTargetRole(user.role);
                                    }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition cursor-pointer"
                                    title="Chuyển đổi vai trò (4 Role)"
                                  >
                                    <ArrowUpDown className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition cursor-pointer"
                                    title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                  >
                                    {user.status === "active" ? (
                                      <Lock className="size-4 text-muted-foreground hover:text-rose-700" />
                                    ) : (
                                      <Unlock className="size-4 text-emerald-700 dark:text-emerald-300" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-700 hover:bg-surface-2 transition cursor-pointer"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="py-3 px-6 bg-surface-2/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản trong hệ thống
                </span>
                <span className="italic">
                  Hệ thống phân quyền thời gian thực · Cập nhật bởi Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB SPECIALISTS: DUYỆT BÁC SĨ DA LIỄU */}
        {currentTab === "specialists" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Stethoscope className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Kiểm Duyệt Hồ Sơ Bác Sĩ Da Liễu (CCHN & Bệnh Viện)</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Super Admin Trần Thị Ngọc Hà đối soát Chứng chỉ hành nghề và đơn vị công tác trước khi kích hoạt quyền kê phác đồ da.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSpecialistFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                    specialistFilter === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  Tất cả ({users.filter((u) => u.role === "specialist").length})
                </button>
                <button
                  onClick={() => setSpecialistFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    specialistFilter === "pending"
                      ? "bg-amber-800 text-amber-50 font-bold"
                      : "bg-amber-700/10 border border-amber-800/30 text-amber-950 dark:text-amber-200"
                  }`}
                >
                  Chờ duyệt ({summaryMetrics.pendingSpecialistsCount})
                </button>
                <button
                  onClick={() => setSpecialistFilter("active")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                    specialistFilter === "active"
                      ? "bg-emerald-700 text-white font-semibold"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  Đã phê duyệt ({users.filter((u) => u.role === "specialist" && u.status === "active").length})
                </button>
              </div>
            </div>

            {/* Alert info banner */}
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="size-4.5 text-emerald-600" />
                <span>Quy trình đảm bảo chuyên môn Y tế SkinSense</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Khi Bác sĩ đăng ký, tài khoản mặc định ở trạng thái <strong>Chờ duyệt (Pending)</strong>. Sau khi Super Admin Trần Thị Ngọc Hà kiểm tra số CCHN trên Cổng thông tin Bộ Y tế và bấm <strong>&quot;Phê duyệt&quot;</strong>, Bác sĩ mới có thể truy cập cổng <code>/specialist</code> để kê phác đồ da và tư vấn bệnh nhân.
              </p>
            </div>

            {/* Specialists Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border font-semibold">
                    <tr>
                      <th className="py-4 px-6 min-w-[220px] whitespace-nowrap">Bác sĩ Chuyên khoa</th>
                      <th className="py-4 px-6 min-w-[180px] whitespace-nowrap">Chứng chỉ CCHN</th>
                      <th className="py-4 px-6 min-w-[220px] whitespace-nowrap">Bệnh viện / Đơn vị</th>
                      <th className="py-4 px-6 min-w-[180px] whitespace-nowrap">Chuyên khoa</th>
                      <th className="py-4 px-6 min-w-[140px] whitespace-nowrap">Trạng thái</th>
                      <th className="py-4 px-6 min-w-[200px] text-right whitespace-nowrap">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSpecialists.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          Không tìm thấy hồ sơ Bác sĩ nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredSpecialists.map((doc) => (
                        <tr key={doc.id} className="hover:bg-surface-2/40 transition">
                          <td className="py-4.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                                <Stethoscope className="size-4.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-[13.5px]">
                                  {doc.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {doc.email} · {doc.phone}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 font-mono text-xs font-semibold text-primary">
                            {doc.specialistDetails?.licenseId || "CCHN-PENDING"}
                          </td>
                          <td className="py-4.5 px-6 text-xs text-foreground font-medium">
                            {doc.specialistDetails?.hospital || "Bệnh viện Da Liễu"}
                          </td>
                          <td className="py-4.5 px-6 text-xs text-muted-foreground">
                            {doc.specialistDetails?.specialty || "Da liễu tổng quát"}
                          </td>
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            {doc.status === "active" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700/10 text-emerald-950 dark:text-emerald-200 border border-emerald-800/25">
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                Đã phê duyệt
                              </span>
                            )}
                            {doc.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-700/15 text-amber-950 dark:text-amber-200 border border-amber-800/30 animate-pulse">
                                <AlertTriangle className="size-3.5 text-amber-600" />
                                Chờ xét duyệt
                              </span>
                            )}
                            {doc.status === "suspended" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-700/10 text-rose-950 dark:text-rose-200 border border-rose-800/25">
                                <XCircle className="size-3.5 text-rose-600" />
                                Đã từ chối / Khóa
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectingSpecialist(doc)}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-2 hover:bg-surface-3 border border-border text-foreground transition cursor-pointer"
                              >
                                Chi tiết CCHN
                              </button>
                              {doc.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => handleApproveSpecialist(doc.id, doc.name)}
                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    <Check className="size-3.5" />
                                    Phê duyệt
                                  </button>
                                  <button
                                    onClick={() => handleRejectSpecialist(doc.id, doc.name)}
                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-rose-600/10 text-rose-700 hover:bg-rose-600/20 border border-rose-600/30 transition cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : doc.status === "active" ? (
                                <button
                                  onClick={() => handleRejectSpecialist(doc.id, doc.name)}
                                  className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-700 hover:bg-rose-600/10 transition cursor-pointer"
                                >
                                  Khóa quyền
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveSpecialist(doc.id, doc.name)}
                                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                                >
                                  Kích hoạt lại
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="py-3 px-6 bg-surface-2/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Hiển thị <strong>{filteredSpecialists.length}</strong> Bác sĩ chuyên khoa Da liễu
                </span>
                <span className="italic">
                  Hệ thống xét duyệt trực tiếp bởi Super Admin Trần Thị Ngọc Hà
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB ROUTINES: PHÂN BỔ ROUTINE 4 ROLE BẰNG DỮ LIỆU THẬT & CÓ TÍCH SAU KHI LÀM */}
        {currentTab === "routines" && (() => {
          const activeRoleRoutine = routinesData[activeRoutineRole] || DEFAULT_ROLE_ROUTINES[activeRoutineRole];
          const steps = activeRoleRoutine?.steps || [];
          const totalSteps = steps.length;
          const completedSteps = steps.filter((s) => s.isCompleted).length;
          const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

          return (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700/10 text-emerald-950 dark:text-emerald-200 border border-emerald-800/30">
                      Dữ liệu thật Supabase (routine_items & routine_entries)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-600/10 text-sky-900 dark:text-sky-300 border border-sky-700/25">
                      4 Nhóm Phân Hệ Role
                    </span>
                  </div>
                  <h2 className="font-display text-base sm:text-xl font-bold text-foreground mt-2">
                    Phân Bổ & Quản Trị Routine Skincare Theo 4 Vai Trò
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Super Admin Trần Thị Ngọc Hà trực tiếp điều phối phác đồ chuẩn y khoa. Mỗi bước tích hợp sản phẩm chính hãng, liều lượng, hướng dẫn thao tác chi tiết và cơ chế tích sau khi làm.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
                    <Server className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>PostgreSQL: <strong>gzecjsqnehgrvkgnznec</strong></span>
                  </div>
                </div>
              </div>

              {/* 4 Role Selector Tabs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(["customer", "specialist", "shop", "admin"] as RoleType[]).map((roleKey) => {
                  const cfg = ROLE_CONFIG[roleKey];
                  const roleRoutine = routinesData[roleKey] || DEFAULT_ROLE_ROUTINES[roleKey];
                  const isActive = activeRoutineRole === roleKey;
                  const Icon = cfg.icon;
                  const stepCount = roleRoutine?.steps?.length || 0;
                  const doneCount = roleRoutine?.steps?.filter((s) => s.isCompleted)?.length || 0;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setActiveRoutineRole(roleKey)}
                      className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-card border-primary ring-2 ring-primary/20 shadow-sm"
                          : "bg-surface-2/40 border-border hover:bg-surface-2 hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`size-8 rounded-lg grid place-items-center ${cfg.iconWrap}`}>
                          <Icon className="size-4" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeClass}`}>
                          {roleKey.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-display font-bold text-sm text-foreground">
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {roleRoutine?.title}
                      </span>
                      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Tiến độ hôm nay:</span>
                        <span className="font-semibold text-foreground">
                          {doneCount}/{stepCount} bước
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Routine Meta Banner & Allocation Tool */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {activeRoleRoutine.treatmentDuration}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-surface-2 text-foreground border border-border">
                        {activeRoleRoutine.skinConcern}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {activeRoleRoutine.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {activeRoleRoutine.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 bg-surface-2/50 p-2.5 rounded-xl border border-border">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">Phân bổ cho tài khoản:</span>
                      <input
                        type="email"
                        value={assignRoutineEmail}
                        onChange={(e) => setAssignRoutineEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs text-foreground outline-none focus:border-primary w-full sm:w-56"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAllocateRoutine(activeRoutineRole)}
                      disabled={isAllocatingRoutine}
                      className="h-8 mt-auto px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="size-3.5" />
                      <span>{isAllocatingRoutine ? "Đang gán..." : "Phân bổ"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
                  <div>
                    <span className="text-muted-foreground">Người thụ hưởng: </span>
                    <strong className="text-foreground">{activeRoleRoutine.targetUser}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phân bổ & Thẩm định bởi: </span>
                    <strong className="text-foreground">{activeRoleRoutine.allocatedBy}</strong>
                  </div>
                </div>
              </div>

              {/* Real-time Progress Bar ("Tích sau khi làm") */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-foreground">
                        Tiến Độ Tích Sau Khi Làm (Daily Completion Checkmark)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Tích vào ô kiểm tra bên dưới mỗi khi hoàn thành từng bước skincare để cập nhật trực tiếp lên Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {completedSteps}/{totalSteps} bước ({progressPercent}%)
                    </span>
                    {progressPercent === 100 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                        Hoàn thành 100% 🎉
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-surface-2 rounded-full h-3.5 overflow-hidden p-0.5 border border-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 transition-all duration-500 shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Step Cards with Product, Dosage, Usage Guide & Checkmark */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Danh Sách Sản Phẩm & Quy Chuẩn Hướng Dẫn Sử Dụng ({totalSteps} Bước)</span>
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Nhấp vào <strong>"Tích sau khi làm"</strong> để đánh dấu
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {steps.map((step) => {
                    const isTicked = Boolean(step.isCompleted);
                    const isStepUpdating = isTickingStep === step.id;

                    return (
                      <div
                        key={step.id}
                        className={`rounded-xl border transition-all p-4 sm:p-5 ${
                          isTicked
                            ? "bg-card border-emerald-600/40 shadow-xs ring-1 ring-emerald-500/10"
                            : "bg-card border-border hover:border-foreground/20"
                        }`}
                      >
                        {/* Step Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0">
                              {step.stepNumber}
                            </span>
                            <span className="font-display font-bold text-sm sm:text-base text-foreground">
                              {step.label}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-border bg-surface-2 text-muted-foreground">
                              {step.category}
                            </span>
                            {/* Step Time Badge */}
                            {step.stepTime === "morning" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <Sun className="size-3" />
                                <span>Buổi sáng</span>
                              </span>
                            )}
                            {step.stepTime === "evening" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Moon className="size-3" />
                                <span>Buổi tối</span>
                              </span>
                            )}
                            {step.stepTime === "both" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                <Sun className="size-3" />
                                <Moon className="size-3" />
                                <span>Sáng & Tối</span>
                              </span>
                            )}
                          </div>

                          {/* Interactive Tick Button ("Có tích sau khi làm") */}
                          <button
                            type="button"
                            onClick={() => handleToggleRoutineStep(activeRoutineRole, step)}
                            disabled={isStepUpdating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
                              isTicked
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 ring-1 ring-emerald-500"
                                : "bg-surface-2 text-foreground border border-border hover:border-emerald-600/50 hover:bg-surface-3"
                            } ${isStepUpdating ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <CheckCircle2 className={`size-4 ${isTicked ? "text-white" : "text-muted-foreground"}`} />
                            <span>
                              {isStepUpdating
                                ? "Đang đồng bộ..."
                                : isTicked
                                ? "Đã thực hiện ✓"
                                : "Tích sau khi làm"}
                            </span>
                          </button>
                        </div>

                        {/* Step Card Content */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
                          {/* Product Thumbnail */}
                          <div className="md:col-span-3 flex flex-row md:flex-col items-center gap-3">
                            <img
                              src={step.imageUrl}
                              alt={step.productName}
                              className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl border border-border shadow-xs shrink-0"
                            />
                            <div className="flex flex-col text-left md:text-center w-full">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Thương hiệu
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {step.brand}
                              </span>
                            </div>
                          </div>

                          {/* Product Details & Usage */}
                          <div className="md:col-span-9 space-y-3">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Sản phẩm chỉ định
                              </span>
                              <h5 className="font-display text-sm sm:text-base font-bold text-foreground mt-0.5">
                                {step.productName}
                              </h5>
                            </div>

                            {/* Active Ingredients */}
                            <div className="flex items-start gap-2 bg-surface-2/60 p-2.5 rounded-lg border border-border text-xs">
                              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-foreground">Hoạt chất chính: </strong>
                                <span className="text-muted-foreground">{step.activeIngredients}</span>
                              </div>
                            </div>

                            {/* Dosage & Usage Guide */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                                  Liều lượng quy chuẩn
                                </span>
                                <p className="text-foreground font-medium leading-relaxed">
                                  {step.dosage}
                                </p>
                              </div>

                              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block flex items-center gap-1">
                                  <Info className="size-3" />
                                  <span>Cách sử dụng chi tiết</span>
                                </span>
                                <p className="text-foreground leading-relaxed">
                                  {step.usageGuide}
                                </p>
                              </div>
                            </div>

                            {isTicked && (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                                <CheckCircle2 className="size-3.5" />
                                <span>Bước này đã hoàn thành hôm nay và được đồng bộ lên Supabase!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: DUYỆT SẢN PHẨM SHOP (PRODUCT MODERATION) - SỬA LỖI XUỐNG DÒNG GIÁ & CHỮ Đ */}
        {currentTab === "products" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Kiểm Duyệt Sản Phẩm Mỹ Phẩm Lên Sàn
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Đảm bảo mỹ phẩm từ các Shop (Nhà cung cấp) đạt chuẩn an toàn trước khi khách hàng (Hà) mua
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                    productFilter === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  Tất cả ({products.length})
                </button>
                <button
                  onClick={() => setProductFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    productFilter === "pending"
                      ? "bg-amber-800 text-amber-50 font-bold"
                      : "bg-amber-700/10 border border-amber-800/30 text-amber-950 dark:text-amber-200"
                  }`}
                >
                  Chờ duyệt ({summaryMetrics.pendingProductsCount})
                </button>
                <button
                  onClick={() => setProductFilter("approved")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                    productFilter === "approved"
                      ? "bg-emerald-700 text-white font-semibold"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  Đã duyệt lên sàn ({products.filter((p) => p.status === "approved").length})
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border font-semibold">
                    <tr>
                      <th className="py-4 px-6 min-w-[280px] whitespace-nowrap">Tên Sản Phẩm Mỹ Phẩm</th>
                      <th className="py-4 px-6 min-w-[200px] whitespace-nowrap">Nhà cung cấp (Shop)</th>
                      <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">Giá niêm yết</th>
                      <th className="py-4 px-6 min-w-[120px] whitespace-nowrap">Kho hàng</th>
                      <th className="py-4 px-6 min-w-[170px] whitespace-nowrap">Trạng thái</th>
                      <th className="py-4 px-6 min-w-[170px] text-right whitespace-nowrap">Phê duyệt của Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-2/40 transition">
                        <td className="py-4.5 px-6 font-medium text-foreground">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{p.name}</span>
                            <span className="text-xs text-muted-foreground mt-1">
                              Ngành hàng: {p.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-amber-950 dark:text-amber-300 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Store className="size-4 shrink-0" />
                            <span>{p.shopName}</span>
                          </div>
                        </td>
                        {/* Giá tiền không bao giờ bị rớt chữ đ xuống dòng */}
                        <td className="py-4.5 px-6 font-mono font-bold text-foreground text-sm whitespace-nowrap">
                          {p.price.toLocaleString("vi-VN")}&nbsp;₫
                        </td>
                        <td className="py-4.5 px-6 text-muted-foreground font-mono text-xs whitespace-nowrap">
                          {p.stock} hộp/chai
                        </td>
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          {p.status === "approved" && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              <CheckCircle2 className="size-4" /> Đang bán trên sàn
                            </span>
                          )}
                          {p.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs">
                              <AlertTriangle className="size-4" /> Chờ Admin duyệt
                            </span>
                          )}
                          {p.status === "rejected" && (
                            <span className="inline-flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-semibold text-xs">
                              <XCircle className="size-4" /> Bị từ chối
                            </span>
                          )}
                        </td>
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          {p.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRejectProduct(p.id, p.name)}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-600/30 transition cursor-pointer"
                              >
                                Từ chối
                              </button>
                              <button
                                onClick={() => handleApproveProduct(p.id, p.name)}
                                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition cursor-pointer flex items-center gap-1"
                              >
                                <Check className="size-3.5" />
                                Phê duyệt
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ĐƠN HÀNG & KHIẾU NẠI (ORDERS & DISPUTES) */}
        {currentTab === "orders" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Quản Lý Đơn Hàng & Xử Lý Tranh Chấp Sàn
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Giám sát luồng giao dịch giữa Khách hàng và Nhà cung cấp, can thiệp khi có khiếu nại
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border font-semibold">
                    <tr>
                      <th className="py-4 px-6 min-w-[130px] whitespace-nowrap">Mã Đơn Hàng</th>
                      <th className="py-4 px-6 min-w-[190px] whitespace-nowrap">Khách Hàng (Người Mua)</th>
                      <th className="py-4 px-6 min-w-[200px] whitespace-nowrap">Gian Hàng Bán</th>
                      <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">Giá Trị Đơn</th>
                      <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">Hoa Hồng Sàn (8%)</th>
                      <th className="py-4 px-6 min-w-[180px] whitespace-nowrap">Trạng Thái</th>
                      <th className="py-4 px-6 min-w-[180px] text-right whitespace-nowrap">Xử Lý Của Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-surface-2/40 transition">
                        <td className="py-4.5 px-6 font-mono font-bold text-foreground text-sm whitespace-nowrap">
                          {o.id}
                        </td>
                        <td className="py-4.5 px-6 font-semibold text-foreground whitespace-nowrap">
                          {o.customerName}
                        </td>
                        <td className="py-4.5 px-6 text-amber-950 dark:text-amber-300 font-semibold whitespace-nowrap">
                          {o.shopName}
                        </td>
                        <td className="py-4.5 px-6 font-mono font-bold text-foreground whitespace-nowrap">
                          {o.totalAmount.toLocaleString("vi-VN")}&nbsp;₫
                        </td>
                        <td className="py-4.5 px-6 font-mono font-semibold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                          +{o.commission.toLocaleString("vi-VN")}&nbsp;₫
                        </td>
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          {o.status === "completed" && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              <CheckCircle2 className="size-4" /> Giao thành công
                            </span>
                          )}
                          {o.status === "shipping" && (
                            <span className="inline-flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-semibold text-xs">
                              <Truck className="size-4" /> Đang vận chuyển
                            </span>
                          )}
                          {o.status === "disputed" && (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-xs">
                                <ShieldAlert className="size-4" /> Có khiếu nại!
                              </span>
                              <span className="text-[11px] text-muted-foreground mt-1">
                                Lý do: {o.disputeReason}
                              </span>
                            </div>
                          )}
                          {o.status === "processing" && (
                            <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-medium text-xs">
                              <Clock className="size-4" /> Shop đang đóng gói
                            </span>
                          )}
                        </td>
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          {o.status === "disputed" ? (
                            <button
                              onClick={() => handleResolveDispute(o.id)}
                              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                            >
                              <RotateCcw className="size-3.5" />
                              Giải quyết & Hoàn tất
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Theo dõi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOANH THU & HOA HỒNG (REVENUE & COMMISSION) */}
        {currentTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Báo Cáo Tài Chính & Hoa Hồng Toàn Sàn
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Doanh số giao dịch thương mại giữa khách hàng và các chủ shop đối tác
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                <span className="text-xs font-medium text-muted-foreground">Tổng Doanh Số Sàn (GMV)</span>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground whitespace-nowrap">
                    {summaryMetrics.totalRevenue.toLocaleString("vi-VN")}&nbsp;₫
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mt-2">
                    <TrendingUp className="size-4" />
                    +18.4% so với tháng trước
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                <span className="text-xs font-medium text-muted-foreground">
                  Hoa Hồng Sàn Thu Về (Mức {commissionRate}%)
                </span>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                    {summaryMetrics.totalCommission.toLocaleString("vi-VN")}&nbsp;₫
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">Lợi nhuận ròng của ban quản trị</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                <span className="text-xs font-medium text-muted-foreground">Tổng Đơn Hàng Thành Công</span>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {orders.length} đơn
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tỷ lệ giao dịch thành công: 98.2%
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Bar chart mock */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Biểu Đồ Doanh Số Giao Dịch 7 Ngày Gần Nhất
                </span>
                <span className="text-xs text-muted-foreground">Đơn vị: Triệu VNĐ</span>
              </div>
              <div className="h-52 flex items-end justify-between gap-4 pt-8 px-4 border-b border-border">
                {[
                  { day: "Thứ 2", val: 3.2, h: "40%" },
                  { day: "Thứ 3", val: 4.8, h: "55%" },
                  { day: "Thứ 4", val: 2.9, h: "35%" },
                  { day: "Thứ 5", val: 6.4, h: "75%" },
                  { day: "Thứ 6", val: 5.1, h: "60%" },
                  { day: "Thứ 7", val: 8.9, h: "95%" },
                  { day: "Chủ Nhật", val: 7.3, h: "85%" },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                      {item.val}M
                    </span>
                    <div
                      style={{ height: item.h }}
                      className="w-full max-w-[48px] rounded-t-md bg-primary/75 group-hover:bg-primary transition"
                    />
                    <span className="text-xs font-medium text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CẤU HÌNH SÀN (PLATFORM SETTINGS) */}
        {currentTab === "settings" && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Cấu Hình Tham Số Sàn Thương Mại & Vận Hành
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Thiết lập mức phí hoa hồng, hạn mức miễn phí vận chuyển và chính sách tự động
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cột trái (chiếm 2 phần): Thiết lập tham số sàn */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 text-[13px] shadow-xs">
                  <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3.5">
                    <Sliders className="size-4.5 text-primary" />
                    Chính Sách Tài Chính & Phí Hoa Hồng Sàn
                  </h3>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        Tỷ Lệ Thu Phí Hoa Hồng Sàn (%)
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 block">
                        Phần trăm sàn trích từ mỗi đơn hàng hoàn tất của Chủ Cửa hàng (Shop)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-18 px-3 py-1.5 text-center font-mono font-bold rounded-lg border border-border bg-card text-foreground"
                      />
                      <span className="font-bold text-foreground">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        Hạn Mức Đơn Hàng Miễn Phí Vận Chuyển (Freeship)
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 block">
                        Đơn hàng đạt giá trị này sẽ được sàn tài trợ chi phí giao hàng
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="50000"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-center font-mono font-bold rounded-lg border border-border bg-card text-foreground"
                      />
                      <span className="text-muted-foreground font-semibold">₫</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        Tự Động Duyệt Sản Phẩm Đã Có Giấy Kiểm Nghiệm BYT
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 block">
                        Bật AI quét số công bố mỹ phẩm để phê duyệt tự động không cần chờ thủ công
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApproveProducts(!autoApproveProducts)}
                      className={`w-12 h-6.5 rounded-full transition relative cursor-pointer ${
                        autoApproveProducts ? "bg-emerald-700" : "bg-surface-2 border border-border"
                      }`}
                    >
                      <span
                        className={`size-5 rounded-full bg-white transition absolute top-0.5 ${
                          autoApproveProducts ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        Chế Độ Bảo Trì Sàn (Maintenance Mode)
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 block">
                        Tạm khóa chức năng đặt mua và đăng ký tài khoản mới khi nâng cấp hệ thống
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-12 h-6.5 rounded-full transition relative cursor-pointer ${
                        maintenanceMode ? "bg-rose-700" : "bg-surface-2 border border-border"
                      }`}
                    >
                      <span
                        className={`size-5 rounded-full bg-white transition absolute top-0.5 ${
                          maintenanceMode ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      onClick={() => toast.success("Đã lưu các thiết lập cấu hình sàn thành công!")}
                      className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer shadow-xs"
                    >
                      Lưu cấu hình hệ thống
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột phải (chiếm 1 phần): Trạng thái Server & Audit Logs */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-xs shadow-xs">
                  <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <Server className="size-4 text-emerald-800 dark:text-emerald-400" />
                    Trạng Thái Máy Chủ
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">CSDL (Supabase):</span>
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-700 dark:bg-emerald-400" />
                        Online (24ms)
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Máy chủ Web (Next.js):</span>
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Uptime 99.98%</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Kho ảnh (Storage):</span>
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Hoạt động tốt</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground">Phiên bản:</span>
                      <span className="font-mono text-muted-foreground">v2.1.0-admin</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-3.5 text-xs shadow-xs">
                  <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <Activity className="size-4 text-muted-foreground" />
                    Nhật Ký Quản Trị Gần Nhất
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-2/40 border border-border">
                      <span className="text-foreground font-semibold block">
                        Super Admin Trần Thị Ngọc Hà vừa phê duyệt hồ sơ Bác sĩ Da liễu
                      </span>
                      <span className="text-muted-foreground text-[11px] mt-0.5 block">10 phút trước</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-2/40 border border-border">
                      <span className="text-foreground font-semibold block">
                        Cập nhật mức thu hoa hồng sàn thành {commissionRate}%
                      </span>
                      <span className="text-muted-foreground text-[11px] mt-0.5 block">1 giờ trước</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-2/40 border border-border">
                      <span className="text-foreground font-semibold block">
                        Khóa tạm thời tài khoản vi phạm chính sách
                      </span>
                      <span className="text-muted-foreground text-[11px] mt-0.5 block">Hôm qua</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: DUYỆT HỒ SƠ CỬA HÀNG (SHOP APPROVAL) */}
      {inspectingShop && inspectingShop.shopDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-amber-700/10 text-amber-900 dark:text-amber-300 flex items-center justify-center">
                  <Store className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Kiểm duyệt Hồ sơ Nhà cung cấp
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Xác minh giấy phép kinh doanh & phân phối trước khi cho phép bán
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingShop(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/50 p-4 space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Tên Cửa hàng:</span>
                <span className="font-semibold text-foreground text-[13px]">
                  {inspectingShop.shopDetails.shopName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Đại diện pháp luật:</span>
                <span className="font-medium text-foreground">{inspectingShop.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Email đăng ký:</span>
                <span className="font-mono text-foreground">{inspectingShop.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Số điện thoại liên hệ:</span>
                <span className="font-mono text-foreground">{inspectingShop.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Mã Giấy phép ĐKKD:</span>
                <span className="font-mono font-bold text-amber-900 dark:text-amber-300">
                  {inspectingShop.shopDetails.license}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Ngành hàng đăng ký:</span>
                <span className="font-medium text-foreground">
                  {inspectingShop.shopDetails.category}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Địa chỉ kho/trụ sở:</span>
                <span className="font-medium text-foreground">
                  {inspectingShop.shopDetails.address}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleRejectShop(inspectingShop.id, inspectingShop.name)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-600/30 transition cursor-pointer"
              >
                Từ chối cấp phép
              </button>
              <button
                onClick={() => handleApproveShop(inspectingShop.id, inspectingShop.name)}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="size-4" />
                Phê duyệt lên sàn ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHUYỂN ĐỔI ROLE (4 ROLE CHANGER) */}
      {editingUserRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Chuyển đổi Vai trò (4 Role)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thay đổi quyền hạn cho tài khoản: <strong>{editingUserRole.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingUserRole(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 py-2">
              {(["customer", "shop", "specialist", "admin"] as RoleType[]).map((r) => {
                const conf = ROLE_CONFIG[r];
                const IconC = conf.icon;
                const isSelected = targetRole === r;

                return (
                  <label
                    key={r}
                    onClick={() => setTargetRole(r)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground font-semibold"
                        : "border-border bg-surface-2/40 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center">
                        <IconC className="size-4.5 text-foreground" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground">{conf.label}</span>
                        <span className="text-[11px] text-muted-foreground">{conf.desc}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="size-4 text-primary" />}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setEditingUserRole(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleChangeRoleSubmit}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
              >
                Lưu thay đổi quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SPECIALIST: XEM CHI TIẾT CCHN & DUYỆT BÁC SĨ */}
      {inspectingSpecialist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-5 text-emerald-600" />
                <h3 className="font-display text-base font-bold text-foreground">
                  Hồ Sơ Y Khoa Bác Sĩ Da Liễu
                </h3>
              </div>
              <button
                onClick={() => setInspectingSpecialist(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Họ và tên Bác sĩ:</span>
                <span className="font-bold text-foreground text-sm">{inspectingSpecialist.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Số Chứng chỉ hành nghề (CCHN):</span>
                <span className="font-mono font-bold text-primary text-sm">
                  {inspectingSpecialist.specialistDetails?.licenseId || "CCHN-008812/BYT"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Bệnh viện / Cơ sở y tế công tác:</span>
                <span className="font-medium text-foreground">
                  {inspectingSpecialist.specialistDetails?.hospital || "Bệnh viện Da Liễu Trung Ương"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Chuyên khoa điều trị:</span>
                <span className="font-medium text-foreground">
                  {inspectingSpecialist.specialistDetails?.specialty || "Trị mụn viêm & Thẩm mỹ da"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Email liên hệ:</span>
                <span className="font-mono text-foreground">{inspectingSpecialist.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Số điện thoại:</span>
                <span className="font-mono text-foreground">{inspectingSpecialist.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Trạng thái hồ sơ:</span>
                <span className="font-bold text-amber-600">
                  {inspectingSpecialist.status === "pending"
                    ? "Đang chờ Super Admin Trần Thị Ngọc Hà xét duyệt"
                    : inspectingSpecialist.status === "active"
                    ? "Đã được phê duyệt"
                    : "Đã tạm dừng"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setInspectingSpecialist(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Đóng
              </button>
              {inspectingSpecialist.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRejectSpecialist(inspectingSpecialist.id, inspectingSpecialist.name)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600/10 text-rose-700 hover:bg-rose-600/20 border border-rose-600/30 transition cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveSpecialist(inspectingSpecialist.id, inspectingSpecialist.name)}
                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="size-3.5" />
                    <span>Phê duyệt Bác sĩ</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: THÊM NGƯỜI DÙNG MỚI */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Thêm Tài khoản Mới
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tạo tài khoản và phân quyền trực tiếp vào hệ thống
                </p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Họ và Tên / Tên Cửa hàng
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A hoặc Shop Mỹ Phẩm"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0905 xxx xxx"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Phân quyền vai trò (Role)
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as RoleType)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-xs"
                >
                  <option value="customer">Khách hàng (customer)</option>
                  <option value="shop">Chủ Cửa hàng (shop)</option>
                  <option value="specialist">Bác sĩ Da liễu (specialist)</option>
                  <option value="admin">Quản trị viên (admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
