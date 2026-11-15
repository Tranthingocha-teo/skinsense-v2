// Limits shared by /api/upload/cloudinary and the uploader, so the browser refuses a file the
// route would refuse anyway, before sending it.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/** An error message for a file the upload route would reject, else null. */
export function checkImageFile(file: { size: number; type?: string }): string | null {
  const type = file.type?.toLowerCase() ?? "";
  if (type && !type.startsWith("image/")) {
    return "Định dạng không hợp lệ. Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP...).";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Dung lượng ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh nhẹ hơn.";
  }
  return null;
}
