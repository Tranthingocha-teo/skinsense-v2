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

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates shop registration and approval request inputs according to retail compliance standards.
 */
export function validateShopApprovalInput(input: Partial<ShopApprovalInput>): ValidationResult {
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
 * Normalizes shop approval form input before submitting to Supabase / API backend.
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
