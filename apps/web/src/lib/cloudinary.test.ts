import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  buildCloudinaryUploadUrl,
  buildShopProductFolder,
  getCloudinaryConfig,
  isCloudinaryConfigured,
  parseCloudinaryUrl,
  signCloudinaryParams,
  uploadImageToCloudinary,
} from "./cloudinary";

describe("Cloudinary Helpers", () => {
  it("parses CLOUDINARY_URL properly", () => {
    const parsed = parseCloudinaryUrl("cloudinary://123456:mySecretKey@demoCloud");
    expect(parsed).toEqual({
      apiKey: "123456",
      apiSecret: "mySecretKey",
      cloudName: "demoCloud",
    });
    expect(parseCloudinaryUrl("invalid-url")).toEqual({
      apiKey: "",
      apiSecret: "",
      cloudName: "",
    });
  });

  it("detects signed vs unsigned vs none mode in getCloudinaryConfig", () => {
    const signed = getCloudinaryConfig({
      CLOUDINARY_CLOUD_NAME: "skinsense-cloud",
      CLOUDINARY_API_KEY: "987654",
      CLOUDINARY_API_SECRET: "secret-abc",
    });
    expect(signed.mode).toBe("signed");
    expect(signed.cloudName).toBe("skinsense-cloud");

    const unsigned = getCloudinaryConfig({
      CLOUDINARY_CLOUD_NAME: "skinsense-cloud",
      CLOUDINARY_UPLOAD_PRESET: "shop_unsigned",
    });
    expect(unsigned.mode).toBe("unsigned");
    expect(unsigned.uploadPreset).toBe("shop_unsigned");

    const missing = getCloudinaryConfig({});
    expect(missing.mode).toBe("none");
    expect(isCloudinaryConfigured({}).configured).toBe(false);
    expect(isCloudinaryConfigured({}).missingKeys).toContain("CLOUDINARY_CLOUD_NAME");
  });

  it("builds normalized Cloudinary folder path for Vietnamese shop names", () => {
    expect(
      buildShopProductFolder("skinsense/products", "Dược Mỹ Phẩm Sakura Đà Nẵng"),
    ).toBe("skinsense/products/duoc-my-pham-sakura-da-nang");
    expect(buildShopProductFolder("skinsense/products")).toBe("skinsense/products");
  });

  it("computes exact SHA-1 signature according to Cloudinary specification", () => {
    const params = {
      timestamp: 1315060510,
      folder: "skinsense/products",
      file: "ignored",
      api_key: "ignored",
    };
    const apiSecret = "abcd";
    const expected = createHash("sha1")
      .update("folder=skinsense/products&timestamp=1315060510abcd")
      .digest("hex");

    expect(signCloudinaryParams(params, apiSecret)).toBe(expected);
  });

  it("uploads image using signed upload and returns secure_url", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        buildCloudinaryUploadUrl("skinsense-demo", "image"),
      );
      expect(init?.method).toBe("POST");
      const form = init?.body as FormData;
      expect(form.get("api_key")).toBe("api-key-1");
      expect(form.get("folder")).toBe("skinsense/products/la-roche-posay");
      expect(form.get("timestamp")).toBe("1700000000");
      expect(form.get("signature")).toBe(
        signCloudinaryParams(
          { folder: "skinsense/products/la-roche-posay", timestamp: 1700000000 },
          "api-secret-1",
        ),
      );
      return new Response(
        JSON.stringify({
          secure_url:
            "https://res.cloudinary.com/skinsense-demo/image/upload/v1700000000/skinsense/products/sample.jpg",
          url: "http://res.cloudinary.com/skinsense-demo/image/upload/v1700000000/skinsense/products/sample.jpg",
          public_id: "skinsense/products/la-roche-posay/sample",
          width: 800,
          height: 800,
          format: "jpg",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await uploadImageToCloudinary(
      "data:image/png;base64,iVBORw0KGgo=",
      {
        shopName: "La Roche-Posay",
        timestamp: 1700000000,
        fetchImpl: mockFetch as unknown as typeof fetch,
        config: {
          cloudName: "skinsense-demo",
          apiKey: "api-key-1",
          apiSecret: "api-secret-1",
          uploadPreset: "",
          folder: "skinsense/products",
          mode: "signed",
        },
      },
    );

    expect(result.secureUrl).toBe(
      "https://res.cloudinary.com/skinsense-demo/image/upload/v1700000000/skinsense/products/sample.jpg",
    );
    expect(result.publicId).toBe("skinsense/products/la-roche-posay/sample");
  });
});
