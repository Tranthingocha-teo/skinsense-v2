// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("/api/upload/cloudinary", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("CLOUDINARY_URL", "");
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    vi.stubEnv("CLOUDINARY_UPLOAD_PRESET", "");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET", "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("GET reports unconfigured status when Cloudinary env vars are missing", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.configured).toBe(false);
    expect(json.missingKeys).toContain("CLOUDINARY_CLOUD_NAME");
  });

  it("POST returns 503 CLOUDINARY_NOT_CONFIGURED when env vars are missing", async () => {
    const req = new Request("http://localhost:3000/api/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl: "data:image/png;base64,iVBORw0KGgo=" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("CLOUDINARY_NOT_CONFIGURED");
  });

  it("POST rejects invalid non-image dataUrl with 400", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "123");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");

    const req = new Request("http://localhost:3000/api/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl: "not-an-image" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("POST uploads base64 camera capture JSON and returns Cloudinary secureUrl", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "key-123");
    vi.stubEnv("CLOUDINARY_API_SECRET", "sec-456");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          secure_url:
            "https://res.cloudinary.com/demo-cloud/image/upload/v1/skinsense/products/camera.jpg",
          public_id: "skinsense/products/camera",
          width: 1280,
          height: 960,
          format: "jpg",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const req = new Request("http://localhost:3000/api/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
        shopName: "Sakura Shop",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.url).toBe(
      "https://res.cloudinary.com/demo-cloud/image/upload/v1/skinsense/products/camera.jpg",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(
      "https://api.cloudinary.com/v1_1/demo-cloud/image/upload",
    );
  });

  it("POST uploads multipart file from device picker to Cloudinary", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo-cloud");
    vi.stubEnv("CLOUDINARY_UPLOAD_PRESET", "unsigned_preset");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          secure_url:
            "https://res.cloudinary.com/demo-cloud/image/upload/v2/skinsense/products/file.png",
          public_id: "skinsense/products/file",
          width: 600,
          height: 600,
          format: "png",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
      "serum.png",
    );
    form.append("shopName", "Sakura Shop");

    const req = new Request("http://localhost:3000/api/upload/cloudinary", {
      method: "POST",
      body: form,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.secureUrl).toBe(
      "https://res.cloudinary.com/demo-cloud/image/upload/v2/skinsense/products/file.png",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
