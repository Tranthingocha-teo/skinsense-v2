import { NextResponse } from "next/server";
import {
  CLOUDINARY_CONSOLE_URL,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

interface BlobLike {
  size: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

function isUploadedBlob(value: unknown): value is Blob | BlobLike {
  if (!value || typeof value !== "object") return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  const candidate = value as { size?: unknown; arrayBuffer?: unknown };
  return (
    typeof candidate.size === "number" &&
    typeof candidate.arrayBuffer === "function"
  );
}

export async function GET() {
  const status = isCloudinaryConfigured();
  return NextResponse.json({
    ok: true,
    configured: status.configured,
    mode: status.mode,
    cloudName: status.cloudName || null,
    folder: status.folder,
    missingKeys: status.missingKeys,
    consoleUrl: CLOUDINARY_CONSOLE_URL,
  });
}

export async function POST(request: Request) {
  try {
    const status = isCloudinaryConfigured();
    if (!status.configured) {
      return NextResponse.json(
        {
          ok: false,
          code: "CLOUDINARY_NOT_CONFIGURED",
          error:
            "Chưa cấu hình tài khoản Cloudinary trên máy chủ. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (hoặc CLOUDINARY_UPLOAD_PRESET) vào apps/web/.env.local.",
          missingKeys: status.missingKeys,
          consoleUrl: CLOUDINARY_CONSOLE_URL,
        },
        { status: 503 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let fileOrDataUrl: Blob | string | null = null;
    let folder: string | undefined;
    let shopName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const uploaded = formData.get("file");
      const rawFolder = formData.get("folder");
      const rawShopName = formData.get("shopName");

      folder = typeof rawFolder === "string" ? rawFolder : undefined;
      shopName = typeof rawShopName === "string" ? rawShopName : undefined;

      if (!isUploadedBlob(uploaded)) {
        return NextResponse.json(
          { ok: false, error: "Thiếu tệp ảnh cần tải lên." },
          { status: 400 },
        );
      }

      const mime = uploaded.type?.toLowerCase() || "";
      if (mime && !mime.startsWith("image/") && !ALLOWED_IMAGE_TYPES.has(mime)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Định dạng không hợp lệ. Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP...).",
          },
          { status: 400 },
        );
      }

      if (uploaded.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: "Dung lượng ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh nhẹ hơn.",
          },
          { status: 400 },
        );
      }

      const blobLike: BlobLike = uploaded;
      fileOrDataUrl =
        typeof Blob !== "undefined" && uploaded instanceof Blob
          ? uploaded
          : new Blob([await blobLike.arrayBuffer()], {
              type: mime || "image/jpeg",
            });
    } else if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as {
        dataUrl?: string;
        folder?: string;
        shopName?: string;
      } | null;

      const dataUrl = body?.dataUrl?.trim() || "";
      folder = body?.folder;
      shopName = body?.shopName;

      if (!dataUrl || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Dữ liệu ảnh không hợp lệ (cần định dạng base64 image Data URL).",
          },
          { status: 400 },
        );
      }

      const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: "Dung lượng ảnh chụp vượt quá 10MB.",
          },
          { status: 400 },
        );
      }

      fileOrDataUrl = dataUrl;
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: "Yêu cầu phải gửi dạng multipart/form-data hoặc JSON chứa dataUrl.",
        },
        { status: 400 },
      );
    }

    const result = await uploadImageToCloudinary(fileOrDataUrl, {
      folder,
      shopName,
    });

    return NextResponse.json({
      ok: true,
      url: result.secureUrl,
      secureUrl: result.secureUrl,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      folder: result.folder,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Tải ảnh lên Cloudinary thất bại.",
      },
      { status: 500 },
    );
  }
}
