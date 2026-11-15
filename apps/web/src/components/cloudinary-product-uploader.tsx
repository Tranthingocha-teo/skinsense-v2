"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CloudUpload,
  FolderOpen,
  ImagePlus,
  Link2,
  RefreshCw,
  Star,
  Trash2,
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const CLOUDINARY_CONSOLE_URL =
  "https://console.cloudinary.com/app/c-b0b4e93af564efab17bf3e2dccd238/image/home";

interface CloudinaryStatusInfo {
  configured: boolean;
  mode: "signed" | "unsigned" | "none";
  cloudName: string | null;
  missingKeys: string[];
  consoleUrl?: string;
}

export interface CloudinaryProductUploaderProps {
  images: string[];
  onChange: (nextImages: string[]) => void;
  shopName?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export function CloudinaryProductUploader({
  images,
  onChange,
  shopName,
  onUploadingChange,
}: CloudinaryProductUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cloudinaryStatus, setCloudinaryStatus] =
    useState<CloudinaryStatusInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressLabel, setUploadProgressLabel] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Live Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  // Optional external URL drawer (NOT required)
  const [showUrlDrawer, setShowUrlDrawer] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  // Check Cloudinary server configuration status
  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload/cloudinary", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ok) {
          setCloudinaryStatus({
            configured: Boolean(data.configured),
            mode: data.mode || "none",
            cloudName: data.cloudName || null,
            missingKeys: Array.isArray(data.missingKeys) ? data.missingKeys : [],
            consoleUrl: data.consoleUrl || CLOUDINARY_CONSOLE_URL,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCloudinaryStatus(null);
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
          `Không thể mở webcam (${msg}). Bạn có thể bấm "Chụp bằng Camera thiết bị" hoặc chọn ảnh từ máy.`,
        );
        return false;
      }
    },
    [stopCameraStream],
  );

  async function uploadSingleFile(file: File | Blob, label?: string) {
    setUploadError(null);
    setIsUploading(true);
    setUploadProgressLabel(label || "Đang đẩy ảnh lên Cloudinary...");

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

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok || !json?.url) {
        const errMsg =
          json?.error || "Không thể đẩy ảnh lên Cloudinary. Vui lòng thử lại.";
        setUploadError(errMsg);
        toast.error(errMsg, { duration: 5000 });
        return null;
      }

      return String(json.url);
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Lỗi kết nối khi đẩy ảnh lên Cloudinary.";
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

    const files = Array.from(fileList);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const url = await uploadSingleFile(
        f,
        files.length > 1
          ? `Đang đẩy ảnh ${i + 1}/${files.length} lên Cloudinary...`
          : `Đang đẩy "${f.name}" lên Cloudinary...`,
      );
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
      toast.success(
        `Đã đẩy ${uploadedUrls.length} ảnh lên Cloudinary và lấy link về thành công!`,
      );
    }
  }

  async function handleOpenCamera() {
    setIsCameraOpen(true);
    const ok = await startCameraStream(facingMode);
    if (!ok && mobileCameraInputRef.current) {
      // Allow user to still see error + click native device camera fallback inside modal
    }
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
      const url = await uploadSingleFile(
        blob,
        "Đang đẩy ảnh vừa chụp từ Camera lên Cloudinary...",
      );
      if (url) {
        onChange([...images, url]);
        toast.success("Đã chụp ảnh và đẩy lên Cloudinary thành công!");
        stopCameraStream();
        setIsCameraOpen(false);
      }
      return;
    }

    // Fallback JSON dataUrl if canvas.toBlob returns null
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setIsUploading(true);
    setUploadProgressLabel("Đang đẩy ảnh chụp lên Cloudinary...");
    try {
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          shopName: shopName?.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.url) {
        const msg = json?.error || "Không thể đẩy ảnh chụp lên Cloudinary.";
        setUploadError(msg);
        toast.error(msg);
        return;
      }
      onChange([...images, String(json.url)]);
      toast.success("Đã chụp ảnh và đẩy lên Cloudinary thành công!");
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

  function handleAddManualUrl() {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      toast.error("Link ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    onChange([...images, trimmed]);
    setManualUrlInput("");
    setShowUrlDrawer(false);
    toast.success("Đã thêm ảnh vào danh sách sản phẩm.");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block font-medium text-foreground">
          Hình Ảnh Sản Phẩm (Tự chọn từ máy hoặc chụp Camera)
        </label>

        {cloudinaryStatus?.configured ? (
          <a
            href={cloudinaryStatus.consoleUrl || CLOUDINARY_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            <CheckCircle2 className="size-3" />
            <span>Cloudinary: {cloudinaryStatus.cloudName}</span>
            <ExternalLink className="size-2.5" />
          </a>
        ) : cloudinaryStatus ? (
          <a
            href={cloudinaryStatus.consoleUrl || CLOUDINARY_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 hover:underline"
          >
            <AlertTriangle className="size-3" />
            <span>Chưa cấu hình khóa Cloudinary (.env.local)</span>
            <ExternalLink className="size-2.5" />
          </a>
        ) : null}
      </div>

      {/* Warning banner if Cloudinary env vars are not set yet */}
      {cloudinaryStatus && !cloudinaryStatus.configured && (
        <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-700 shrink-0" />
            <span>Cần điền thông tin Cloudinary trong apps/web/.env.local để lưu ảnh thật</span>
          </div>
          <p className="text-muted-foreground">
            Vào{" "}
            <a
              href={CLOUDINARY_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              Cloudinary Console
            </a>{" "}
            (Settings &rarr; API Keys), lấy <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code>CLOUDINARY_API_KEY</code>, <code>CLOUDINARY_API_SECRET</code>{" "}
            (hoặc <code>CLOUDINARY_UPLOAD_PRESET</code>) điền vào{" "}
            <code>apps/web/.env.local</code>.
          </p>
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
          <span>Chọn ảnh từ máy tính / điện thoại</span>
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
        multiple
        data-testid="cloudinary-file-input"
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
        data-testid="cloudinary-camera-input"
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
          <span>{uploadProgressLabel || "Đang đẩy ảnh lên Cloudinary..."}</span>
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
              <span>Chụp ảnh sản phẩm gửi lên Cloudinary</span>
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
                  <span>Chụp &amp; Tải lên Cloudinary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Images Gallery Preview */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
            <span>
              Đã chọn {images.length} ảnh (ảnh đầu tiên hiển thị làm Ảnh bìa)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => {
              const isCloudinary = imgUrl.includes("res.cloudinary.com");
              return (
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
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {idx === 0 && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                        Ảnh bìa
                      </span>
                    )}
                    {isCloudinary && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs">
                        <CloudUpload className="size-2.5" />
                        <span>Cloudinary</span>
                      </span>
                    )}
                  </div>

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
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 text-[11px] text-muted-foreground flex items-center gap-2">
          <ImagePlus className="size-4 shrink-0 text-muted-foreground/70" />
          <span>
            Chưa có ảnh sản phẩm. Bạn có thể chọn ảnh từ máy hoặc chụp từ camera để đẩy lên Cloudinary (không bắt buộc dán link sẵn).
          </span>
        </div>
      )}

      {/* Optional manual URL toggle (non-required) */}
      <div>
        <button
          type="button"
          onClick={() => setShowUrlDrawer((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition cursor-pointer"
        >
          <Link2 className="size-3" />
          <span>
            {showUrlDrawer
              ? "Ẩn nhập URL thủ công"
              : "Hoặc dán link URL ảnh có sẵn (tùy chọn, không bắt buộc)"}
          </span>
        </button>

        {showUrlDrawer && (
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddManualUrl();
                }
              }}
              placeholder="https://res.cloudinary.com/..."
              className="min-h-10 flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="min-h-10 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer"
            >
              Thêm link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
