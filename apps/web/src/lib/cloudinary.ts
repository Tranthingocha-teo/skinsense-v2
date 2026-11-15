import { createHash } from "node:crypto";

export const DEFAULT_CLOUDINARY_FOLDER = "skinsense/products";
export const CLOUDINARY_CONSOLE_URL =
  "https://console.cloudinary.com/app/c-b0b4e93af564efab17bf3e2dccd238/image/home";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  folder: string;
  mode: "signed" | "unsigned" | "none";
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  folder?: string;
}

export function parseCloudinaryUrl(urlStr?: string): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} {
  if (!urlStr) {
    return { cloudName: "", apiKey: "", apiSecret: "" };
  }
  const trimmed = urlStr.trim();
  const match = /^cloudinary:\/\/([^:@]+):([^@]+)@([^/?#]+)$/i.exec(trimmed);
  if (!match) {
    return { cloudName: "", apiKey: "", apiSecret: "" };
  }
  return {
    apiKey: decodeURIComponent(match[1]),
    apiSecret: decodeURIComponent(match[2]),
    cloudName: decodeURIComponent(match[3]),
  };
}

export function getCloudinaryConfig(
  env: Record<string, string | undefined> = process.env,
): CloudinaryConfig {
  const fromUrl = parseCloudinaryUrl(env.CLOUDINARY_URL);

  const cloudName = (
    env.CLOUDINARY_CLOUD_NAME ||
    env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    fromUrl.cloudName ||
    ""
  ).trim();
  const apiKey = (env.CLOUDINARY_API_KEY || fromUrl.apiKey || "").trim();
  const apiSecret = (env.CLOUDINARY_API_SECRET || fromUrl.apiSecret || "").trim();
  const uploadPreset = (
    env.CLOUDINARY_UPLOAD_PRESET ||
    env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    ""
  ).trim();
  const folder = sanitizeCloudinaryFolder(
    env.CLOUDINARY_FOLDER || DEFAULT_CLOUDINARY_FOLDER,
  );

  let mode: CloudinaryConfig["mode"] = "none";
  if (cloudName && apiKey && apiSecret) {
    mode = "signed";
  } else if (cloudName && uploadPreset) {
    mode = "unsigned";
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
    folder,
    mode,
  };
}

export function isCloudinaryConfigured(
  env: Record<string, string | undefined> = process.env,
): {
  configured: boolean;
  mode: CloudinaryConfig["mode"];
  cloudName: string;
  folder: string;
  missingKeys: string[];
} {
  const cfg = getCloudinaryConfig(env);
  const missingKeys: string[] = [];

  if (!cfg.cloudName) {
    missingKeys.push("CLOUDINARY_CLOUD_NAME");
  }
  if (cfg.mode === "none") {
    if (!cfg.uploadPreset) {
      if (!cfg.apiKey) missingKeys.push("CLOUDINARY_API_KEY");
      if (!cfg.apiSecret) missingKeys.push("CLOUDINARY_API_SECRET");
    }
  }

  return {
    configured: cfg.mode !== "none",
    mode: cfg.mode,
    cloudName: cfg.cloudName,
    folder: cfg.folder,
    missingKeys,
  };
}

export function sanitizeCloudinaryFolder(folder?: string): string {
  const cleaned = (folder || DEFAULT_CLOUDINARY_FOLDER)
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  return cleaned || DEFAULT_CLOUDINARY_FOLDER;
}

export function buildShopProductFolder(
  baseFolder: string,
  shopName?: string,
): string {
  const base = sanitizeCloudinaryFolder(baseFolder);
  if (!shopName || !shopName.trim()) {
    return base;
  }
  const slug = shopName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug ? `${base}/${slug}` : base;
}

/**
 * Computes a Cloudinary REST API SHA-1 signature for signed uploads.
 * Excludes file, cloud_name, resource_type, api_key and empty values.
 */
export function signCloudinaryParams(
  params: Record<string, string | number | undefined>,
  apiSecret: string,
): string {
  const excluded = new Set(["file", "cloud_name", "resource_type", "api_key"]);
  const serialized = Object.keys(params)
    .filter((key) => {
      if (excluded.has(key)) return false;
      const val = params[key];
      return val !== undefined && val !== null && String(val) !== "";
    })
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

export function buildCloudinaryUploadUrl(
  cloudName: string,
  resourceType: "image" | "auto" = "image",
): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`;
}

export async function uploadImageToCloudinary(
  fileOrDataUrl: Blob | string,
  options?: {
    folder?: string;
    shopName?: string;
    config?: CloudinaryConfig;
    fetchImpl?: typeof fetch;
    timestamp?: number;
  },
): Promise<CloudinaryUploadResult> {
  const cfg = options?.config || getCloudinaryConfig();
  if (cfg.mode === "none") {
    throw new Error(
      "Chưa cấu hình Cloudinary (thiếu CLOUDINARY_CLOUD_NAME và API_KEY/API_SECRET hoặc UPLOAD_PRESET).",
    );
  }

  const targetFolder = buildShopProductFolder(
    options?.folder || cfg.folder,
    options?.shopName,
  );
  const timestamp = options?.timestamp ?? Math.floor(Date.now() / 1000);
  const form = new FormData();

  if (typeof fileOrDataUrl === "string") {
    form.append("file", fileOrDataUrl);
  } else {
    const filename =
      "name" in fileOrDataUrl && typeof fileOrDataUrl.name === "string"
        ? fileOrDataUrl.name
        : `product-${timestamp}.jpg`;
    form.append("file", fileOrDataUrl, filename);
  }

  if (cfg.mode === "signed") {
    const signParams: Record<string, string | number> = {
      folder: targetFolder,
      timestamp,
    };
    const signature = signCloudinaryParams(signParams, cfg.apiSecret);
    form.append("folder", targetFolder);
    form.append("timestamp", String(timestamp));
    form.append("api_key", cfg.apiKey);
    form.append("signature", signature);
  } else {
    form.append("upload_preset", cfg.uploadPreset);
    form.append("folder", targetFolder);
  }

  const fetchFn = options?.fetchImpl || fetch;
  const uploadUrl = buildCloudinaryUploadUrl(cfg.cloudName, "image");
  const res = await fetchFn(uploadUrl, {
    method: "POST",
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    folder?: string;
    error?: { message?: string };
  };

  if (!res.ok || (!payload.secure_url && !payload.url)) {
    const msg =
      payload?.error?.message ||
      `Cloudinary upload thất bại (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const secureUrl = payload.secure_url || payload.url || "";
  return {
    url: payload.url || secureUrl,
    secureUrl,
    publicId: payload.public_id || "",
    width: payload.width,
    height: payload.height,
    format: payload.format,
    bytes: payload.bytes,
    folder: payload.folder || targetFolder,
  };
}
