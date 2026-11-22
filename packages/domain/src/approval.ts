export interface DoctorApprovalInput {
  fullName: string;
  licenseId: string;
  hospital: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  specialty?: string;
}

export interface ShopApprovalInput {
  shopName: string;
  ownerName: string;
  license: string;
  category: string;
  address: string;
  email: string;
  password?: string;
  phoneNumber?: string;
}

export interface ApprovalValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates doctor registration and CCHN approval inputs.
 */
export function validateDoctorApprovalInput(input: Partial<DoctorApprovalInput>): ApprovalValidationResult {
  const name = (input.fullName || "").trim();
  if (!name || name.length < 2) {
    return { isValid: false, error: "Vui lòng nhập Họ và tên Bác sĩ." };
  }

  const license = (input.licenseId || "").trim();
  if (!license || license.length < 3) {
    return { isValid: false, error: "Vui lòng nhập Số Chứng chỉ hành nghề (CCHN)." };
  }

  const hospital = (input.hospital || "").trim();
  if (!hospital || hospital.length < 2) {
    return { isValid: false, error: "Vui lòng nhập Bệnh viện / Cơ sở y tế công tác." };
  }

  const email = (input.email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { isValid: false, error: "Vui lòng nhập địa chỉ Email hợp lệ." };
  }

  if (input.password !== undefined && input.password.length < 6) {
    return { isValid: false, error: "Mật khẩu bảo mật phải có ít nhất 6 ký tự." };
  }

  const phone = (input.phoneNumber || "").trim().replace(/[\s.-]/g, "");
  if (phone) {
    const phoneRegex = /^\+?[0-9]{9,12}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: "Số điện thoại liên hệ không hợp lệ (từ 9 đến 12 số)." };
    }
  }

  return { isValid: true };
}

/**
 * Normalizes doctor approval form inputs before sending to backend.
 */
export function sanitizeDoctorApprovalInput(input: DoctorApprovalInput): DoctorApprovalInput {
  return {
    fullName: input.fullName.trim(),
    licenseId: input.licenseId.trim(),
    hospital: input.hospital.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    phoneNumber: input.phoneNumber ? input.phoneNumber.trim().replace(/[\s.-]/g, "") : "",
    specialty: input.specialty ? input.specialty.trim() : "Da liễu & Điều trị mụn",
  };
}

/**
 * Validates shop partner registration and license approval inputs.
 */
export function validateShopApprovalInput(input: Partial<ShopApprovalInput>): ApprovalValidationResult {
  const shopName = (input.shopName || "").trim();
  if (!shopName || shopName.length < 2) {
    return { isValid: false, error: "Vui lòng nhập Tên Gian hàng / Thương hiệu kinh doanh." };
  }

  const owner = (input.ownerName || "").trim();
  if (!owner || owner.length < 2) {
    return { isValid: false, error: "Vui lòng nhập Họ và tên Chủ sở hữu / Người đại diện." };
  }

  const license = (input.license || "").trim();
  if (!license || license.length < 3) {
    return { isValid: false, error: "Vui lòng nhập Mã số thuế hoặc Số ĐKKD / Giấy phép kinh doanh." };
  }

  const category = (input.category || "").trim();
  if (!category || category.length < 2) {
    return { isValid: false, error: "Vui lòng chọn hoặc nhập Danh mục sản phẩm kinh doanh." };
  }

  const address = (input.address || "").trim();
  if (!address || address.length < 3) {
    return { isValid: false, error: "Vui lòng nhập Địa chỉ gian hàng / Kho xuất hàng." };
  }

  const email = (input.email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { isValid: false, error: "Vui lòng nhập địa chỉ Email hợp lệ." };
  }

  if (input.password !== undefined && input.password.length < 6) {
    return { isValid: false, error: "Mật khẩu bảo mật phải có ít nhất 6 ký tự." };
  }

  const phone = (input.phoneNumber || "").trim().replace(/[\s.-]/g, "");
  if (phone) {
    const phoneRegex = /^\+?[0-9]{9,12}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: "Số điện thoại liên hệ không hợp lệ (từ 9 đến 12 số)." };
    }
  }

  return { isValid: true };
}

/**
 * Normalizes shop approval form inputs before sending to backend.
 */
export function sanitizeShopApprovalInput(input: ShopApprovalInput): ShopApprovalInput {
  return {
    shopName: input.shopName.trim(),
    ownerName: input.ownerName.trim(),
    license: input.license.trim(),
    category: input.category.trim(),
    address: input.address.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    phoneNumber: input.phoneNumber ? input.phoneNumber.trim().replace(/[\s.-]/g, "") : "",
  };
}

export type ShopApprovalStatus = "pending" | "active" | "suspended" | "rejected";
export type ProductApprovalStatus = "pending" | "approved" | "rejected" | "active" | "hidden" | "out_of_stock";

export interface ShopUserSession {
  role: string;
  status: ShopApprovalStatus | string;
  email?: string;
  fullName?: string;
}

/**
 * Checks whether a shop account is permitted to access seller center functions.
 */
export function canShopSignIn(user: ShopUserSession | null | undefined): {
  allowed: boolean;
  reason?: string;
} {
  if (!user) {
    return {
      allowed: false,
      reason: "Vui lòng đăng nhập tài khoản Gian hàng đối tác.",
    };
  }

  if (user.email === "hattn.23itb@vku.udn.vn" || user.role === "admin") {
    return { allowed: true };
  }

  if (user.role !== "shop") {
    return {
      allowed: false,
      reason: "Tài khoản của bạn không phải là tài khoản Gian hàng đối tác.",
    };
  }

  if (user.status === "pending") {
    return {
      allowed: false,
      reason:
        "Hồ sơ Gian hàng của bạn đang chờ Super Admin (Trần Thị Ngọc Hà) xét duyệt. Bạn chưa thể đăng nhập sử dụng các chức năng Kênh Người Bán cho đến khi hồ sơ được phê duyệt.",
    };
  }

  if (user.status === "suspended" || user.status === "rejected" || user.status === "blocked") {
    return {
      allowed: false,
      reason:
        "Hồ sơ Gian hàng của bạn đã bị từ chối phê duyệt hoặc đang bị tạm khóa bởi Super Admin. Vui lòng liên hệ hattn.23itb@vku.udn.vn.",
    };
  }

  if (user.status === "active" || user.status === "approved") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Trạng thái tài khoản không hợp lệ để truy cập Kênh Người Bán.",
  };
}

/**
 * Checks whether a shop can submit products for listing.
 */
export function canShopPostProduct(user: ShopUserSession | null | undefined): boolean {
  return canShopSignIn(user).allowed;
}

/**
 * Only approved/active products are visible on the buyer storefront.
 */
export function isProductVisibleToBuyer(status: ProductApprovalStatus | string): boolean {
  return status === "approved" || status === "active";
}

/**
 * Maps a product moderation status to display badge metadata.
 */
export function getProductApprovalBadge(status: ProductApprovalStatus | string): {
  label: string;
  variant: "pending" | "approved" | "rejected" | "neutral";
  description: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Chờ Admin duyệt",
        variant: "pending",
        description: "Sản phẩm đang chờ Super Admin phê duyệt nguồn gốc và hồ sơ công bố",
      };
    case "approved":
    case "active":
      return {
        label: "Đang bán trên sàn",
        variant: "approved",
        description: "Sản phẩm đã được kiểm định và đang mở bán chính thức",
      };
    case "rejected":
      return {
        label: "Bị từ chối",
        variant: "rejected",
        description: "Sản phẩm bị từ chối cấp phép do chưa đạt tiêu chuẩn sàn",
      };
    case "out_of_stock":
      return {
        label: "Tạm hết hàng",
        variant: "neutral",
        description: "Sản phẩm tạm thời hết hàng trong kho",
      };
    default:
      return {
        label: "Đã ẩn",
        variant: "neutral",
        description: "Sản phẩm đang tạm ẩn khỏi gian hàng",
      };
  }
}

/**
 * Checks whether two shop names belong to the same store.
 */
export function matchesShop(shopA?: string, shopB?: string): boolean {
  if (!shopA || !shopB) return false;
  const a = shopA.trim().toLowerCase();
  const b = shopB.trim().toLowerCase();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const brandKeywords = [
    "la roche-posay",
    "cerave",
    "innisfree",
    "bioderma",
    "anessa",
    "ordinary",
    "sakura",
  ];
  for (const kw of brandKeywords) {
    if (a.includes(kw) && b.includes(kw)) return true;
  }
  return false;
}

/**
 * Filters products belonging to the specified shop name.
 */
export function filterProductsByShop<T extends { shopName?: string }>(
  products: T[],
  currentShopName?: string,
  isSuperAdmin = false,
): T[] {
  if (!Array.isArray(products)) return [];
  if (isSuperAdmin && (!currentShopName || currentShopName === "all")) {
    return products;
  }
  if (!currentShopName || !currentShopName.trim()) {
    return [];
  }
  return products.filter((p) => matchesShop(p.shopName, currentShopName));
}
