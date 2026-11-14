export interface DoctorApprovalInput {
  fullName: string;
  licenseId: string;
  hospital: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  specialty?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates doctor registration and approval request inputs according to medical compliance standards.
 */
export function validateDoctorApprovalInput(input: Partial<DoctorApprovalInput>): ValidationResult {
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
 * Normalizes doctor approval form input before submitting to Supabase / API backend.
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
