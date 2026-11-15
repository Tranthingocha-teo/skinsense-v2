import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudinaryProductUploader } from "./cloudinary-product-uploader";

describe("CloudinaryProductUploader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders file picker and camera buttons without forcing a preset image URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: true,
          mode: "signed",
          cloudName: "skinsense-demo",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<CloudinaryProductUploader images={[]} onChange={() => {}} />);

    expect(
      screen.getByRole("button", { name: /Chọn ảnh từ máy tính/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chụp ảnh trực tiếp từ Camera/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Chưa có ảnh sản phẩm/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Cloudinary: skinsense-demo/i)).toBeInTheDocument();
    });
  });

  it("shows configuration warning when Cloudinary env vars are not set yet", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: false,
          mode: "none",
          cloudName: null,
          missingKeys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<CloudinaryProductUploader images={[]} onChange={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Cần điền thông tin Cloudinary trong apps\/web\/\.env\.local/i),
      ).toBeInTheDocument();
    });
  });

  it("uploads device-selected image file to Cloudinary API and adds returned URL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            configured: true,
            mode: "signed",
            cloudName: "skinsense-demo",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            url: "https://res.cloudinary.com/skinsense-demo/image/upload/v123/product.jpg",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const onChange = vi.fn();
    render(
      <CloudinaryProductUploader
        images={[]}
        onChange={onChange}
        shopName="Sakura Shop"
      />,
    );

    const fileInput = screen.getByTestId("cloudinary-file-input");
    const file = new File(["image-bytes"], "kem-duong.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        "https://res.cloudinary.com/skinsense-demo/image/upload/v123/product.jpg",
      ]);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toBe("/api/upload/cloudinary");
  });

  it("allows setting a secondary image as cover and removing images", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: true,
          mode: "signed",
          cloudName: "skinsense-demo",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const onChange = vi.fn();
    const img1 =
      "https://res.cloudinary.com/skinsense-demo/image/upload/v1/first.jpg";
    const img2 =
      "https://res.cloudinary.com/skinsense-demo/image/upload/v1/second.jpg";

    render(<CloudinaryProductUploader images={[img1, img2]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Đặt làm ảnh bìa/i }));
    expect(onChange).toHaveBeenCalledWith([img2, img1]);

    fireEvent.click(screen.getByRole("button", { name: /Xóa ảnh 1/i }));
    expect(onChange).toHaveBeenCalledWith([img2]);
  });
});
