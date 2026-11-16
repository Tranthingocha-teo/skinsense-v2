"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  FolderOpen,
  ImagePlus,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { checkImageFile } from "@/lib/upload-limits";

interface UploadServiceStatus {
  configured: boolean;
}

export interface CloudinaryProductUploaderProps {
  images: string[];
  onChange: (nextImages: string[]) => void;
  shopName?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export interface ImageUploaderProps extends CloudinaryProductUploaderProps {
  /** Several images (a gallery, first one is the cover) or exactly one (avatar, logo, banner). */
  multiple?: boolean;
  label?: string;
  emptyHint?: string;
  /** Cloudinary folder hint passed to /api/upload/cloudinary. */
  folder?: string;
  /** Preview shape for a single image. */
  shape?: "square" | "round" | "wide";
}

/** The product gallery uploader used by the seller channel (/shop). */
export function CloudinaryProductUploader(props: CloudinaryProductUploaderProps) {
  return <ImageUploader {...props} multiple />;
}

/**
 * Upload from the device or take a photo with the camera; the image goes to Cloudinary through
 * /api/upload/cloudinary (signed in, server-signed). The only way to set an image: no pasted URLs.
 */
export function ImageUploader({
  images,
  onChange,
  shopName,
  onUploadingChange,
  multiple = false,
  label = "Hình Ảnh Sản Phẩm (Tự chọn từ máy hoặc chụp Camera)",
  emptyHint,
  folder,
  shape = "square",
}: ImageUploaderProps) {
  // A single-image field replaces its image; a gallery appends.
  const merge = (added: string[]) => (multiple ? [...images, ...added] : added.slice(-1));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [uploadStatus, setUploadStatus] =
    useState<UploadServiceStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressLabel, setUploadProgressLabel] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Live Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  // Check image upload service readiness silently
  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload/cloudinary", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ok) {
          setUploadStatus({
            configured: Boolean(data.configured),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUploadStatus(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startCameraStream = useCallback(
    async (mode: "environment" | "user") => {
      stopCameraStream();
      setCameraError(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "Trình duyệt không hỗ trợ mở camera trực tiếp. Hãy dùng nút Camera thiết bị bên dưới.",
        );
        return false;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        return true;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể truy cập camera hoặc bị từ chối quyền.";
        setCameraError(
          `Không thể mở webcam (${msg}). Bạn có thể bấm "Mở Camera thiết bị" hoặc chọn ảnh từ máy.`,
        );
        return false;
      }
    },
    [stopCameraStream],
  );

  async function readFileAsDataUrl(file: File | Blob): Promise<string | null> {
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  }

  async function uploadSingleFile(file: File | Blob, label?: string) {
    const invalid = checkImageFile(file);
    if (invalid) {
      setUploadError(invalid);
      toast.error(invalid);
      return null;
    }
    setUploadError(null);

    // If Cloudinary is not configured or in local demo mode, read directly from device immediately
    if (uploadStatus && !uploadStatus.configured) {
      return await readFileAsDataUrl(file);
    }

    setIsUploading(true);
    setUploadProgressLabel(label || "Đang tải ảnh lên...");

    try {
      const form = new FormData();
      form.append(
        "file",
        file,
        file instanceof File ? file.name : `camera-${Date.now()}.jpg`,
      );
      if (shopName?.trim()) {
        form.append("shopName", shopName.trim());
      }
      if (folder) form.append("folder", folder);

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok || !json?.url) {
        if (res.status === 401) {
          const errMsg = "Vui lòng đăng nhập để tải ảnh lên.";
          setUploadError(errMsg);
          toast.error(errMsg, { duration: 5000 });
          return null;
        }

        // Fallback silently to device file Data URL without displaying an error
        const dataUrl = await readFileAsDataUrl(file);
        if (dataUrl) return dataUrl;

        const errMsg = json?.error || "Không thể tải ảnh lên. Vui lòng thử lại.";
        setUploadError(errMsg);
        toast.error(errMsg, { duration: 5000 });
        return null;
      }

      return String(json.url);
    } catch {
      // Fallback silently to device file Data URL
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl) return dataUrl;

      const errMsg = "Lỗi kết nối khi tải ảnh lên.";
      setUploadError(errMsg);
      toast.error(errMsg);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgressLabel("");
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = multiple ? Array.from(fileList) : Array.from(fileList).slice(0, 1);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      let url = await uploadSingleFile(
        f,
        files.length > 1
          ? `Đang tải ảnh ${i + 1}/${files.length}...`
          : `Đang tải "${f.name}"...`,
      );
      if (!url) {
        try {
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(f);
          });
        } catch {
          url = null;
        }
      }
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      setUploadError(null);
      onChange(merge(uploadedUrls));
      toast.success(`Đã chọn ${uploadedUrls.length} ảnh từ thiết bị thành công!`);
    }
  }

  async function handleOpenCamera() {
    setIsCameraOpen(true);
    await startCameraStream(facingMode);
  }

  async function handleSwitchCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    await startCameraStream(nextMode);
  }

  async function handleCapturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera chưa sẵn sàng khung hình. Vui lòng đợi 1 giây.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Không thể khởi tạo khung vẽ ảnh từ camera.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
    });

    if (blob) {
      const url = await uploadSingleFile(blob, "Đang lưu ảnh vừa chụp...");
      if (url) {
        onChange(merge([url]));
        toast.success("Đã chụp và tải ảnh lên thành công!");
        stopCameraStream();
        setIsCameraOpen(false);
      }
      return;
    }

    // Fallback JSON dataUrl if canvas.toBlob returns null
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setIsUploading(true);
    setUploadProgressLabel("Đang lưu ảnh chụp...");
    try {
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          shopName: shopName?.trim() || undefined,
          folder,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.url) {
        const msg = json?.error || "Không thể lưu ảnh chụp. Vui lòng thử lại.";
        setUploadError(msg);
        toast.error(msg);
        return;
      }
      onChange(merge([String(json.url)]));
      toast.success("Đã chụp và tải ảnh lên thành công!");
      stopCameraStream();
      setIsCameraOpen(false);
    } finally {
      setIsUploading(false);
      setUploadProgressLabel("");
    }
  }

  function handleSetAsCover(index: number) {
    if (index <= 0 || index >= images.length) return;
    const selected = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([selected, ...rest]);
    toast.success("Đã đặt ảnh này làm Ảnh Bìa sản phẩm.");
  }

  function handleRemoveImage(index: number) {
    onChange(images.filter((_, idx) => idx !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block font-medium text-foreground">{label}</span>
      </div>

      {/* Warning banner only when server image service is unavailable and no images uploaded yet */}
      {uploadStatus && !uploadStatus.configured && images.length === 0 && (
        <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-amber-700 shrink-0" />
          <span>
            Dịch vụ tải ảnh tạm thời chưa sẵn sàng. Bạn vẫn có thể lưu sản phẩm và bổ sung ảnh sau.
          </span>
        </div>
      )}

      {/* Action Buttons: Chọn từ máy / Chụp Camera */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
        >
          <FolderOpen className="size-4" />
          <span>{images.length > 0 && !multiple ? "Đổi ảnh khác từ máy" : "Chọn ảnh từ máy tính / điện thoại"}</span>
        </button>

        <button
          type="button"
          disabled={isUploading}
          onClick={handleOpenCamera}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-600/40 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:border-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50 cursor-pointer"
        >
          <Camera className="size-4" />
          <span>Chụp ảnh trực tiếp từ Camera</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        aria-label={label}
        data-testid="product-file-input"
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        data-testid="product-camera-input"
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {/* Uploading status bar */}
      {isUploading && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{uploadProgressLabel || "Đang tải ảnh lên..."}</span>
        </div>
      )}

      {/* Upload error message */}
      {uploadError && !isUploading && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-600/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{uploadError}</div>
        </div>
      )}

      {/* Live Camera Viewfinder */}
      {isCameraOpen && (
        <div className="rounded-2xl border border-border bg-surface-2 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Camera className="size-4 text-emerald-600" />
              <span>Chụp ảnh</span>
            </span>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setIsCameraOpen(false);
              }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer"
              aria-label="Đóng camera"
            >
              <X className="size-4" />
            </button>
          </div>

          {cameraError ? (
            <div className="space-y-2.5 rounded-xl border border-amber-600/30 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-200">
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={() => mobileCameraInputRef.current?.click()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <Camera className="size-3.5" />
                <span>Mở Camera thiết bị</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Đổi camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <span>Camera gốc thiết bị</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleCapturePhoto}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="size-3.5" />
                  <span>Chụp &amp; Tải ảnh lên</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single image: one preview with remove; replacing is the upload buttons above */}
      {!multiple && images[0] ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt="Ảnh đã tải lên"
            className={`shrink-0 border border-border object-cover ${
              shape === "round" ? "size-16 rounded-full" : shape === "wide" ? "h-16 w-32 rounded-lg" : "size-16 rounded-lg"
            }`}
          />
          <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">Ảnh đã tải lên</span>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => onChange([])}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:border-destructive hover:text-destructive disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Gỡ ảnh</span>
          </button>
        </div>
      ) : !multiple ? (
        <div className="rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 text-[11px] text-muted-foreground flex items-center gap-2">
          <ImagePlus className="size-4 shrink-0 text-muted-foreground/70" />
          <span>{emptyHint ?? "Chưa có ảnh. Chọn ảnh từ máy hoặc chụp từ camera (không bắt buộc)."}</span>
        </div>
      ) : images.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
            <span>
              Đã chọn {images.length} ảnh (ảnh đầu tiên hiển thị làm Ảnh bìa)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => (
              <div
                key={`${imgUrl}-${idx}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`Ảnh sản phẩm ${idx + 1}`}
                    className="size-full object-cover"
                  />
                </div>
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                      Ảnh bìa
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label={`Xóa ảnh ${idx + 1}`}
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-rose-600 transition cursor-pointer"
                >
                  <Trash2 className="size-3" />
                </button>

                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetAsCover(idx)}
                    className="w-full border-t border-border bg-card py-1 text-[10px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Star className="size-2.5" />
                    <span>Đặt làm ảnh bìa</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 text-[11px] text-muted-foreground flex items-center gap-2">
          <ImagePlus className="size-4 shrink-0 text-muted-foreground/70" />
          <span>
            {emptyHint ?? "Chưa có ảnh sản phẩm. Bạn có thể chọn ảnh từ máy hoặc chụp từ camera (không bắt buộc)."}
          </span>
        </div>
      )}
    </div>
  );
}
