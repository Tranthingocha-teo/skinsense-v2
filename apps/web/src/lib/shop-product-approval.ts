export type ShopApprovalStatus = "pending" | "active" | "suspended" | "rejected";
export type ProductApprovalStatus = "pending" | "approved" | "rejected" | "active" | "hidden" | "out_of_stock";

export interface ShopUserSession {
  role: string;
  status: ShopApprovalStatus | string;
  email?: string;
  fullName?: string;
}

/**
 * Checks whether a shop account is permitted to sign in to seller center functions.
 * Only active/approved shops (or super admin) can log in.
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

  // Super Admin always has full access
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
        "⏳ Hồ sơ Gian hàng của bạn đang chờ Super Admin (Trần Thị Ngọc Hà) xét duyệt. Bạn chưa thể đăng nhập sử dụng các chức năng Kênh Người Bán cho đến khi hồ sơ được phê duyệt!",
    };
  }

  if (user.status === "suspended" || user.status === "rejected") {
    return {
      allowed: false,
      reason:
        "🚫 Hồ sơ Gian hàng của bạn đã bị từ chối phê duyệt hoặc đang bị tạm khóa bởi Super Admin. Vui lòng liên hệ hattn.23itb@vku.udn.vn.",
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
 * Checks whether a shop can post new products for sale.
 * Only approved/active shops can submit products.
 */
export function canShopPostProduct(user: ShopUserSession | null | undefined): boolean {
  return canShopSignIn(user).allowed;
}

/**
 * Checks whether a product can be shown and purchased on the public marketplace (Buyer Storefront).
 * Products in pending or rejected status MUST NEVER be listed for sale to buyers.
 */
export function isProductVisibleToBuyer(status: ProductApprovalStatus | string): boolean {
  return status === "approved" || status === "active";
}

/**
 * Returns user-friendly status badge configuration for products.
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
        label: "Đang bán",
        variant: "approved",
        description: "Sản phẩm đang mở bán",
      };
  }
}
